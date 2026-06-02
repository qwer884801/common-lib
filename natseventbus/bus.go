package natseventbus

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/eventbus"
	"github.com/byte-v-forge/common-lib/eventcatalog"
	commonv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/common/v1"
	"github.com/nats-io/nats.go"
	"google.golang.org/protobuf/proto"
)

const (
	DefaultURL       = nats.DefaultURL
	DefaultStream    = eventcatalog.StreamName
	DefaultSubject   = eventcatalog.StreamSubject
	DefaultFetchWait = 5 * time.Second
)

type Config struct {
	URL        string
	ClientName string
}

type Bus struct {
	conn   *nats.Conn
	js     nats.JetStreamContext
	stream string
}

func Connect(cfg Config, opts ...nats.Option) (*Bus, error) {
	url := strings.TrimSpace(cfg.URL)
	if url == "" {
		url = DefaultURL
	}
	name := strings.TrimSpace(cfg.ClientName)
	if name == "" {
		name = "byte-v-forge"
	}
	options := append([]nats.Option{
		nats.Name(name),
		nats.Timeout(5 * time.Second),
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(time.Second),
	}, opts...)
	conn, err := nats.Connect(url, options...)
	if err != nil {
		return nil, fmt.Errorf("connect nats: %w", err)
	}
	js, err := conn.JetStream()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("initialize jetstream: %w", err)
	}
	return &Bus{conn: conn, js: js, stream: DefaultStream}, nil
}

func ConnectRequired(cfg Config, requiredMessage string, opts ...nats.Option) (*Bus, error) {
	if strings.TrimSpace(cfg.URL) == "" {
		requiredMessage = strings.TrimSpace(requiredMessage)
		if requiredMessage == "" {
			requiredMessage = "nats url is required"
		}
		return nil, errors.New(requiredMessage)
	}
	return Connect(cfg, opts...)
}

func (b *Bus) Close() {
	if b == nil || b.conn == nil {
		return
	}
	b.conn.Drain()
	b.conn.Close()
}

func (b *Bus) Publish(ctx context.Context, message eventbus.Message) (eventbus.PublishAck, error) {
	if b == nil || b.js == nil {
		return eventbus.PublishAck{}, errors.New("nats event bus is not connected")
	}
	envelope, err := eventbus.NewEnvelope(message)
	if err != nil {
		return eventbus.PublishAck{}, err
	}
	payload, err := proto.Marshal(envelope)
	if err != nil {
		return eventbus.PublishAck{}, fmt.Errorf("marshal event envelope: %w", err)
	}
	msg := &nats.Msg{
		Subject: envelope.GetSubject(),
		Header:  envelopeHeaders(envelope),
		Data:    payload,
	}
	opts := []nats.PubOpt{nats.Context(ctx)}
	if idempotencyKey := strings.TrimSpace(envelope.GetContext().GetIdempotencyKey()); idempotencyKey != "" {
		opts = append(opts, nats.MsgId(idempotencyKey))
	}
	ack, err := b.js.PublishMsg(msg, opts...)
	if err != nil {
		return eventbus.PublishAck{}, fmt.Errorf("publish nats event %s: %w", envelope.GetSubject(), err)
	}
	return eventbus.PublishAck{
		Stream:    ack.Stream,
		Sequence:  ack.Sequence,
		Duplicate: ack.Duplicate,
	}, nil
}

type ConsumerConfig struct {
	Stream  string
	Subject string
	Durable string
	Batch   int
	MaxWait time.Duration
	AckWait time.Duration
}

type PullConsumer struct {
	sub     *nats.Subscription
	bus     *Bus
	durable string
	batch   int
	maxWait time.Duration
}

func (b *Bus) PullConsumer(cfg ConsumerConfig) (*PullConsumer, error) {
	if b == nil || b.js == nil {
		return nil, errors.New("nats event bus is not connected")
	}
	subject := strings.TrimSpace(cfg.Subject)
	if subject == "" {
		subject = DefaultSubject
	}
	durable := strings.TrimSpace(cfg.Durable)
	if durable == "" {
		return nil, errors.New("durable consumer name is required")
	}
	opts := []nats.SubOpt{
		nats.BindStream(normalizedStreamName(cfg.Stream)),
		nats.ManualAck(),
		nats.AckExplicit(),
	}
	if cfg.AckWait > 0 {
		opts = append(opts, nats.AckWait(cfg.AckWait))
	}
	sub, err := b.js.PullSubscribe(subject, durable, opts...)
	if err != nil {
		return nil, fmt.Errorf("create nats pull consumer %s: %w", durable, err)
	}
	batch := cfg.Batch
	if batch <= 0 {
		batch = 10
	}
	maxWait := cfg.MaxWait
	if maxWait <= 0 {
		maxWait = DefaultFetchWait
	}
	return &PullConsumer{sub: sub, bus: b, durable: durable, batch: batch, maxWait: maxWait}, nil
}

func (b *Bus) PullWorkerConsumer(stream string, subject string, durable string, batch int, ackWait time.Duration) (*PullConsumer, error) {
	return b.PullConsumer(ConsumerConfig{
		Stream:  stream,
		Subject: subject,
		Durable: durable,
		Batch:   batch,
		MaxWait: DefaultFetchWait,
		AckWait: ackWait,
	})
}

func (b *Bus) PullWorkerForDefinition(stream string, definition eventcatalog.Definition, batch int, ackWait time.Duration) (*PullConsumer, error) {
	return b.PullWorkerForBinding(stream, definition.DefaultConsumerBinding(), batch, ackWait)
}

func (b *Bus) PullWorkerForBinding(stream string, binding eventcatalog.ConsumerBinding, batch int, ackWait time.Duration) (*PullConsumer, error) {
	if err := binding.Validate(); err != nil {
		return nil, err
	}
	return b.PullWorkerConsumer(stream, binding.Subject(), binding.DurableName(), batch, ackWait)
}

func (c *PullConsumer) Fetch(ctx context.Context, batch int) ([]eventbus.ReceivedMessage, error) {
	if c == nil || c.sub == nil {
		return nil, errors.New("nats pull consumer is not configured")
	}
	if batch <= 0 {
		batch = c.batch
	}
	fetchCtx, cancel := context.WithTimeout(ctx, c.maxWait)
	defer cancel()
	messages, err := c.sub.Fetch(batch, nats.Context(fetchCtx))
	if errors.Is(err, nats.ErrTimeout) || errors.Is(err, context.DeadlineExceeded) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("fetch nats messages: %w", err)
	}
	out := make([]eventbus.ReceivedMessage, 0, len(messages))
	for _, msg := range messages {
		received, err := receivedMessage(c.bus, c.durable, msg)
		if err != nil {
			_ = msg.Term()
			return nil, err
		}
		out = append(out, received)
	}
	return out, nil
}

func receivedMessage(bus *Bus, durable string, msg *nats.Msg) (eventbus.ReceivedMessage, error) {
	envelope := &commonv1.EventEnvelope{}
	if err := proto.Unmarshal(msg.Data, envelope); err != nil {
		return eventbus.ReceivedMessage{}, fmt.Errorf("decode nats event envelope: %w", err)
	}
	attempt := deliveryAttempt(msg)
	return eventbus.ReceivedMessage{
		Subject:    msg.Subject,
		Envelope:   envelope,
		Attributes: envelope.GetAttributes(),
		Attempt:    attempt,
		Ack: func(context.Context) error {
			return msg.Ack()
		},
		Nak: func(context.Context) error {
			return msg.Nak()
		},
		NakDelay: func(_ context.Context, delay time.Duration) error {
			return msg.NakWithDelay(delay)
		},
		Term: func(context.Context) error {
			return msg.Term()
		},
		DeadLetter: func(ctx context.Context, reason string) error {
			return publishDeadLetter(ctx, bus, durable, envelope, attempt, reason)
		},
	}, nil
}

func deliveryAttempt(msg *nats.Msg) int32 {
	if msg == nil {
		return 0
	}
	meta, err := msg.Metadata()
	if err != nil || meta == nil {
		return 0
	}
	return int32(meta.NumDelivered)
}

func publishDeadLetter(ctx context.Context, bus *Bus, durable string, envelope *commonv1.EventEnvelope, attempt int32, reason string) error {
	if bus == nil || envelope == nil {
		return nil
	}
	original := envelope.GetContext()
	originalID := ""
	originalName := ""
	originalVersion := ""
	originalSource := ""
	correlationID := ""
	traceID := ""
	if original != nil {
		originalID = original.GetEventId()
		originalName = original.GetEventName()
		originalVersion = original.GetEventVersion()
		originalSource = original.GetSourceService()
		correlationID = original.GetCorrelationId()
		traceID = original.GetTraceId()
	}
	eventID := eventbus.StableEventID("dead-letter-", envelope.GetSubject(), originalID, durable, fmt.Sprintf("%d", attempt))
	deadCtx := eventbus.NewEventContext(eventbus.EventContextConfig{
		EventID:       eventID,
		EventName:     "platform.dead_letter",
		EventVersion:  eventcatalog.EventVersionV1,
		SourceService: "platform-eventbus",
		CorrelationID: correlationID,
		TraceID:       traceID,
	})
	message, err := eventcatalog.DeadLetter.NewMessage(
		&commonv1.DeadLetterEvent{
			Context:               deadCtx,
			OriginalSubject:       envelope.GetSubject(),
			OriginalEventId:       originalID,
			OriginalEventName:     originalName,
			OriginalEventVersion:  originalVersion,
			OriginalSourceService: originalSource,
			ConsumerDurable:       durable,
			DeliveryAttempt:       attempt,
			ErrorCode:             "terminated",
			ErrorMessage:          reason,
			CorrelationId:         correlationID,
		},
		deadCtx,
		eventbus.Attributes(
			"original_subject", envelope.GetSubject(),
			"original_event_id", originalID,
			"consumer_durable", durable,
			"delivery_attempt", fmt.Sprintf("%d", attempt),
		),
	)
	if err != nil {
		return err
	}
	_, err = bus.Publish(ctx, message)
	return err
}

func envelopeHeaders(envelope *commonv1.EventEnvelope) nats.Header {
	headers := nats.Header{}
	if envelope == nil {
		return headers
	}
	headers.Set("Bvf-Event-Subject", envelope.GetSubject())
	headers.Set("Bvf-Event-Type", envelope.GetProtoType())
	headers.Set("Content-Type", envelope.GetContentType())
	if ctx := envelope.GetContext(); ctx != nil {
		headers.Set("Bvf-Event-Id", ctx.GetEventId())
		headers.Set("Bvf-Event-Name", ctx.GetEventName())
		headers.Set("Bvf-Event-Version", ctx.GetEventVersion())
		headers.Set("Bvf-Correlation-Id", ctx.GetCorrelationId())
		headers.Set("Bvf-Trace-Id", ctx.GetTraceId())
		headers.Set("Bvf-Idempotency-Key", ctx.GetIdempotencyKey())
	}
	return headers
}

func normalizedStreamName(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return DefaultStream
	}
	return value
}

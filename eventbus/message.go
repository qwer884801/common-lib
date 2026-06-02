package eventbus

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	commonv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/common/v1"
	"google.golang.org/protobuf/proto"
)

const ProtobufContentType = "application/x-protobuf"

var (
	ErrEmptySubject        = errors.New("event subject is required")
	ErrEmptyEvent          = errors.New("event message is required")
	ErrEmptyPayload        = errors.New("event payload is required")
	ErrEmptyEventContext   = errors.New("event context is required")
	ErrEmptyEventID        = errors.New("event context event_id is required")
	ErrEmptyEventName      = errors.New("event context event_name is required")
	ErrEmptyEventVersion   = errors.New("event context event_version is required")
	ErrEmptySourceService  = errors.New("event context source_service is required")
	ErrEmptyIdempotencyKey = errors.New("event context idempotency_key is required")
	ErrEmptyOccurredAt     = errors.New("event context occurred_at is required")
)

type Message struct {
	Subject    string
	Event      proto.Message
	Context    *commonv1.EventContext
	Attributes map[string]string
}

type ReceivedMessage struct {
	Subject    string
	Envelope   *commonv1.EventEnvelope
	Attributes map[string]string
	Attempt    int32
	Ack        func(context.Context) error
	Nak        func(context.Context) error
	NakDelay   func(context.Context, time.Duration) error
	Term       func(context.Context) error
	DeadLetter func(context.Context, string) error
}

type PublishAck struct {
	Stream    string
	Sequence  uint64
	Duplicate bool
}

type Publisher interface {
	Publish(context.Context, Message) (PublishAck, error)
}

type Consumer interface {
	Fetch(context.Context, int) ([]ReceivedMessage, error)
}

func NewEnvelope(message Message) (*commonv1.EventEnvelope, error) {
	subject := strings.TrimSpace(message.Subject)
	if subject == "" {
		return nil, ErrEmptySubject
	}
	if message.Event == nil {
		return nil, ErrEmptyEvent
	}
	if err := ValidateContext(message.Context); err != nil {
		return nil, err
	}
	payload, err := proto.Marshal(message.Event)
	if err != nil {
		return nil, fmt.Errorf("marshal event payload: %w", err)
	}
	return &commonv1.EventEnvelope{
		Context:     message.Context,
		Subject:     subject,
		ProtoType:   string(message.Event.ProtoReflect().Descriptor().FullName()),
		Payload:     payload,
		ContentType: ProtobufContentType,
		Attributes:  cloneAttributes(message.Attributes),
	}, nil
}

func ValidateContext(eventCtx *commonv1.EventContext) error {
	if eventCtx == nil {
		return ErrEmptyEventContext
	}
	if strings.TrimSpace(eventCtx.GetEventId()) == "" {
		return ErrEmptyEventID
	}
	if strings.TrimSpace(eventCtx.GetEventName()) == "" {
		return ErrEmptyEventName
	}
	if strings.TrimSpace(eventCtx.GetEventVersion()) == "" {
		return ErrEmptyEventVersion
	}
	if eventCtx.GetOccurredAt() == nil || !eventCtx.GetOccurredAt().IsValid() {
		return ErrEmptyOccurredAt
	}
	if strings.TrimSpace(eventCtx.GetSourceService()) == "" {
		return ErrEmptySourceService
	}
	if strings.TrimSpace(eventCtx.GetIdempotencyKey()) == "" {
		return ErrEmptyIdempotencyKey
	}
	return nil
}

func UnmarshalPayload(message ReceivedMessage, event proto.Message) error {
	if event == nil {
		return ErrEmptyEvent
	}
	if message.Envelope == nil || len(message.Envelope.GetPayload()) == 0 {
		return ErrEmptyPayload
	}
	if err := proto.Unmarshal(message.Envelope.GetPayload(), event); err != nil {
		return fmt.Errorf("unmarshal event payload: %w", err)
	}
	return nil
}

func cloneAttributes(values map[string]string) map[string]string {
	if len(values) == 0 {
		return nil
	}
	out := make(map[string]string, len(values))
	for key, value := range values {
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		out[key] = strings.TrimSpace(value)
	}
	return out
}

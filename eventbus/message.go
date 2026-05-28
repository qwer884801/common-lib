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
	ErrEmptySubject = errors.New("event subject is required")
	ErrEmptyEvent   = errors.New("event message is required")
	ErrEmptyPayload = errors.New("event payload is required")
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

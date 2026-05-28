package eventbus

import (
	"strings"
	"time"

	commonv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/common/v1"
	"github.com/byte-v-forge/common-lib/hashx"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const DefaultEventVersion = "v1"

type EventContextConfig struct {
	EventID        string
	EventName      string
	EventVersion   string
	OccurredAt     time.Time
	SourceService  string
	CorrelationID  string
	TraceID        string
	IdempotencyKey string
}

func NewEventContext(cfg EventContextConfig) *commonv1.EventContext {
	eventVersion := strings.TrimSpace(cfg.EventVersion)
	if eventVersion == "" {
		eventVersion = DefaultEventVersion
	}
	occurredAt := cfg.OccurredAt
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}
	idempotencyKey := strings.TrimSpace(cfg.IdempotencyKey)
	eventID := strings.TrimSpace(cfg.EventID)
	if idempotencyKey == "" {
		idempotencyKey = eventID
	}
	return &commonv1.EventContext{
		EventId:        eventID,
		EventName:      strings.TrimSpace(cfg.EventName),
		EventVersion:   eventVersion,
		OccurredAt:     timestamppb.New(occurredAt),
		SourceService:  strings.TrimSpace(cfg.SourceService),
		CorrelationId:  strings.TrimSpace(cfg.CorrelationID),
		TraceId:        strings.TrimSpace(cfg.TraceID),
		IdempotencyKey: idempotencyKey,
	}
}

func StableEventID(prefix string, parts ...string) string {
	return strings.TrimSpace(prefix) + hashx.StableParts(parts...)
}

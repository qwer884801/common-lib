package hotstream

import (
	"strings"
	"time"

	observabilityv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/observability/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const SubjectPrefix = "byte.v.forge.hot"

type EventConfig struct {
	EventID       string
	EventType     string
	SourceService string
	ResourceType  string
	ResourceID    string
	Scope         string
	OccurredAt    time.Time
	CorrelationID string
	TraceID       string
	Attributes    map[string]string
}

func NewEvent(cfg EventConfig) *observabilityv1.HotStreamEvent {
	occurredAt := cfg.OccurredAt
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}
	return &observabilityv1.HotStreamEvent{
		EventId:       strings.TrimSpace(cfg.EventID),
		EventType:     strings.TrimSpace(cfg.EventType),
		SourceService: strings.TrimSpace(cfg.SourceService),
		ResourceType:  strings.TrimSpace(cfg.ResourceType),
		ResourceId:    strings.TrimSpace(cfg.ResourceID),
		Scope:         strings.TrimSpace(cfg.Scope),
		OccurredAt:    timestamppb.New(occurredAt),
		CorrelationId: strings.TrimSpace(cfg.CorrelationID),
		TraceId:       strings.TrimSpace(cfg.TraceID),
		Attributes:    CleanAttributes(cfg.Attributes),
	}
}

func ServiceStateSubject(service string) string {
	service = strings.Trim(strings.ToLower(strings.TrimSpace(service)), ".")
	if service == "" {
		service = "platform"
	}
	return SubjectPrefix + "." + service + ".state"
}

func CleanAttributes(input map[string]string) map[string]string {
	if len(input) == 0 {
		return nil
	}
	out := map[string]string{}
	for key, value := range input {
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key == "" || value == "" {
			continue
		}
		out[key] = value
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

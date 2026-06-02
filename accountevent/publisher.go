package accountevent

import (
	"context"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	"github.com/byte-v-forge/common-lib/eventbus"
	"github.com/byte-v-forge/common-lib/eventcatalog"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type Publisher struct {
	publisher     eventbus.Publisher
	sourceService string
}

type Config struct {
	Publisher     eventbus.Publisher
	SourceService string
	Descriptor    accountmodel.Descriptor
}

func NewPublisher(cfg Config) *Publisher {
	if cfg.Publisher == nil {
		return nil
	}
	return &Publisher{publisher: cfg.Publisher, sourceService: firstNonEmpty(cfg.SourceService, cfg.Descriptor.SourceService)}
}

func (p *Publisher) PublishUpserted(ctx context.Context, account *accountv1.Account) (eventbus.PublishAck, error) {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPSERTED, account)
}

func (p *Publisher) PublishUpdated(ctx context.Context, account *accountv1.Account) (eventbus.PublishAck, error) {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPDATED, account)
}

func (p *Publisher) PublishDeleted(ctx context.Context, account *accountv1.Account) (eventbus.PublishAck, error) {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_DELETED, account)
}

func (p *Publisher) PublishStatusChanged(ctx context.Context, account *accountv1.Account) (eventbus.PublishAck, error) {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_STATUS_CHANGED, account)
}

func (p *Publisher) PublishCredentialChanged(ctx context.Context, account *accountv1.Account) (eventbus.PublishAck, error) {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_CREDENTIAL_CHANGED, account)
}

func (p *Publisher) PublishChanged(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) (eventbus.PublishAck, error) {
	if p == nil || p.publisher == nil || account == nil {
		return eventbus.PublishAck{}, nil
	}
	if err := accountmodel.ValidateKey(account.GetKey()); err != nil {
		return eventbus.PublishAck{}, err
	}
	message, err := Message(kind, account, p.sourceService)
	if err != nil {
		return eventbus.PublishAck{}, err
	}
	return p.publisher.Publish(ctx, message)
}

func Message(kind accountv1.AccountChangeKind, account *accountv1.Account, sourceService string) (eventbus.Message, error) {
	if account == nil {
		account = accountmodel.Account(nil)
	}
	metadata := accountmodel.ChangeMetadata(kind, account, sourceService, time.Time{})
	eventID := eventbus.StableEventID("account-", metadata.EventIDParts()...)
	context := eventbus.NewEventContext(eventbus.EventContextConfig{
		EventID:       eventID,
		EventName:     eventcatalog.AccountChanged.EventName,
		EventVersion:  eventcatalog.AccountChanged.EventVersion,
		OccurredAt:    metadata.OccurredAt,
		SourceService: metadata.SourceService,
		CorrelationID: metadata.CorrelationID,
	})
	return eventcatalog.AccountChanged.NewMessage(
		&accountv1.AccountChangedEvent{
			Context:    context,
			ChangeKind: metadata.Kind,
			Account:    account,
		},
		context,
		metadata.Attributes,
	)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

package accountstream

import (
	"context"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	"github.com/byte-v-forge/common-lib/eventbus"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
	"github.com/byte-v-forge/common-lib/hotstream"
)

type Publisher struct {
	publisher     hotstream.Publisher
	sourceService string
}

type Config struct {
	Publisher     hotstream.Publisher
	SourceService string
	Descriptor    accountmodel.Descriptor
}

func NewPublisher(cfg Config) *Publisher {
	if cfg.Publisher == nil {
		return nil
	}
	return &Publisher{publisher: cfg.Publisher, sourceService: firstNonEmpty(cfg.SourceService, cfg.Descriptor.SourceService)}
}

func (p *Publisher) PublishUpserted(ctx context.Context, account *accountv1.Account) error {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPSERTED, account)
}

func (p *Publisher) PublishUpdated(ctx context.Context, account *accountv1.Account) error {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPDATED, account)
}

func (p *Publisher) PublishDeleted(ctx context.Context, account *accountv1.Account) error {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_DELETED, account)
}

func (p *Publisher) PublishStatusChanged(ctx context.Context, account *accountv1.Account) error {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_STATUS_CHANGED, account)
}

func (p *Publisher) PublishCredentialChanged(ctx context.Context, account *accountv1.Account) error {
	return p.PublishChanged(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_CREDENTIAL_CHANGED, account)
}

func (p *Publisher) PublishChanged(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error {
	if p == nil || p.publisher == nil || account == nil {
		return nil
	}
	if err := accountmodel.ValidateKey(account.GetKey()); err != nil {
		return err
	}
	metadata := accountmodel.ChangeMetadata(kind, account, p.sourceService, time.Time{})
	return p.publisher.Publish(context.WithoutCancel(ctx), hotstream.NewEvent(hotstream.EventConfig{
		EventID:       eventbus.StableEventID("account-", metadata.EventIDParts()...),
		EventType:     metadata.EventType,
		SourceService: metadata.SourceService,
		ResourceType:  metadata.ResourceType,
		ResourceID:    metadata.ResourceID,
		Scope:         metadata.Scope,
		OccurredAt:    metadata.OccurredAt,
		CorrelationID: metadata.CorrelationID,
		Attributes:    metadata.Attributes,
	}))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

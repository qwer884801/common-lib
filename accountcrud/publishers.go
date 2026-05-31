package accountcrud

import (
	"context"

	"github.com/byte-v-forge/common-lib/eventbus"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type EventBusChangePublisher interface {
	PublishChanged(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) (eventbus.PublishAck, error)
}

func FromEventBusPublisher(publisher EventBusChangePublisher) ChangePublisher {
	if publisher == nil {
		return nil
	}
	return ChangePublisherFunc(func(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error {
		_, err := publisher.PublishChanged(ctx, kind, account)
		return err
	})
}

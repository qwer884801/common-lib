package accountcrud

import (
	"context"
	"time"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type PublishErrorFunc func(context.Context, accountv1.AccountChangeKind, *accountv1.Account, error)

type PublisherOptions struct {
	Timeout      time.Duration
	Detached     bool
	IgnoreErrors bool
	OnError      PublishErrorFunc
}

func WrapPublisher(publisher ChangePublisher, options PublisherOptions) ChangePublisher {
	if publisher == nil {
		return nil
	}
	return wrappedPublisher{publisher: publisher, options: options}
}

func BestEffortPublisher(publisher ChangePublisher, onError PublishErrorFunc) ChangePublisher {
	return WrapPublisher(publisher, PublisherOptions{IgnoreErrors: true, OnError: onError})
}

func TimeoutPublisher(publisher ChangePublisher, timeout time.Duration) ChangePublisher {
	return WrapPublisher(publisher, PublisherOptions{Timeout: timeout})
}

type wrappedPublisher struct {
	publisher ChangePublisher
	options   PublisherOptions
}

func (p wrappedPublisher) PublishChanged(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error {
	if p.publisher == nil {
		return nil
	}
	publishCtx := ctx
	if p.options.Detached {
		publishCtx = context.WithoutCancel(publishCtx)
	}
	var cancel context.CancelFunc
	if p.options.Timeout > 0 {
		publishCtx, cancel = context.WithTimeout(publishCtx, p.options.Timeout)
	}
	if cancel != nil {
		defer cancel()
	}
	err := p.publisher.PublishChanged(publishCtx, kind, account)
	if err == nil {
		return nil
	}
	if p.options.OnError != nil && ctx.Err() == nil {
		p.options.OnError(ctx, kind, account, err)
	}
	if p.options.IgnoreErrors {
		return nil
	}
	return err
}

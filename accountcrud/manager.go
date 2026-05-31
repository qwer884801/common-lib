package accountcrud

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type ListRequest struct {
	Cursor string
	Limit  int
}

type Page[T any] struct {
	Records    []T
	NextCursor string
}

type Store[T any] interface {
	List(ctx context.Context, req ListRequest) (Page[T], error)
	Get(ctx context.Context, accountID string) (T, bool, error)
	Upsert(ctx context.Context, record T) (T, error)
	Delete(ctx context.Context, accountID string) (T, bool, error)
}

type AccountOfFunc[T any] func(record T) *accountv1.Account

type ChangePublisher interface {
	PublishChanged(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error
}

type ChangePublisherFunc func(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error

func (f ChangePublisherFunc) PublishChanged(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error {
	if f == nil {
		return nil
	}
	return f(ctx, kind, account)
}

type Manager[T any] struct {
	store      Store[T]
	descriptor accountmodel.Descriptor
	accountOf  AccountOfFunc[T]
	publishers []ChangePublisher
	now        func() time.Time
	accountID  string
}

type Config[T any] struct {
	Store      Store[T]
	Descriptor accountmodel.Descriptor
	AccountOf  AccountOfFunc[T]
	Publishers []ChangePublisher
	Now        func() time.Time
	IDField    string
}

func New[T any](cfg Config[T]) *Manager[T] {
	return &Manager[T]{
		store:      cfg.Store,
		descriptor: cfg.Descriptor,
		accountOf:  firstAccountOf(cfg.AccountOf),
		publishers: cleanPublishers(cfg.Publishers),
		now:        firstNow(cfg.Now),
		accountID:  firstNonEmpty(cfg.IDField, "account_id"),
	}
}

func (m *Manager[T]) List(ctx context.Context, req ListRequest) (Page[T], error) {
	if err := m.configured(); err != nil {
		return Page[T]{}, err
	}
	req.Cursor = strings.TrimSpace(req.Cursor)
	req.Limit = accountmodel.NormalizePageLimit(req.Limit)
	return m.store.List(ctx, req)
}

func (m *Manager[T]) Get(ctx context.Context, accountID string) (T, bool, error) {
	var zero T
	if err := m.configured(); err != nil {
		return zero, false, err
	}
	normalized, err := m.normalizeID(accountID)
	if err != nil {
		return zero, false, err
	}
	return m.store.Get(ctx, normalized)
}

func (m *Manager[T]) Upsert(ctx context.Context, record T) (T, error) {
	return m.Save(ctx, record, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPSERTED)
}

func (m *Manager[T]) Update(ctx context.Context, record T) (T, error) {
	return m.Save(ctx, record, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPDATED)
}

func (m *Manager[T]) Save(ctx context.Context, record T, kind accountv1.AccountChangeKind) (T, error) {
	var zero T
	if err := m.configured(); err != nil {
		return zero, err
	}
	stored, err := m.store.Upsert(ctx, record)
	if err != nil {
		return zero, err
	}
	return stored, m.publish(ctx, kind, stored)
}

func (m *Manager[T]) Delete(ctx context.Context, accountID string) (bool, error) {
	if err := m.configured(); err != nil {
		return false, err
	}
	normalized, err := m.normalizeID(accountID)
	if err != nil {
		return false, err
	}
	deleted, found, err := m.store.Delete(ctx, normalized)
	if err != nil || !found {
		return found, err
	}
	return true, m.publishDeleted(ctx, normalized, deleted)
}

func (m *Manager[T]) publishDeleted(ctx context.Context, accountID string, record T) error {
	account := m.accountOf(record)
	if account == nil {
		account = m.descriptor.Tombstone(accountID, m.now())
	}
	return m.publishAccount(ctx, accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_DELETED, account)
}

func (m *Manager[T]) publish(ctx context.Context, kind accountv1.AccountChangeKind, record T) error {
	account := m.accountOf(record)
	if account == nil {
		return nil
	}
	return m.publishAccount(ctx, kind, account)
}

func (m *Manager[T]) publishAccount(ctx context.Context, kind accountv1.AccountChangeKind, account *accountv1.Account) error {
	if len(m.publishers) == 0 || account == nil {
		return nil
	}
	if err := accountmodel.ValidateKey(account.GetKey()); err != nil {
		return err
	}
	for _, publisher := range m.publishers {
		if err := publisher.PublishChanged(ctx, kind, account); err != nil {
			return err
		}
	}
	return nil
}

func (m *Manager[T]) normalizeID(accountID string) (string, error) {
	if m == nil {
		return "", fmt.Errorf("account manager is not configured")
	}
	if strings.TrimSpace(m.descriptor.SourceService) != "" || strings.TrimSpace(m.descriptor.AccountType) != "" {
		return m.descriptor.NormalizeID(accountID, m.accountID)
	}
	return accountmodel.NormalizeAccountIDField(accountID, m.accountID)
}

func (m *Manager[T]) configured() error {
	if m == nil || m.store == nil {
		return fmt.Errorf("account manager store is not configured")
	}
	return nil
}

func firstAccountOf[T any](fn AccountOfFunc[T]) AccountOfFunc[T] {
	if fn != nil {
		return fn
	}
	return func(record T) *accountv1.Account {
		switch value := any(record).(type) {
		case *accountv1.Account:
			return value
		default:
			return nil
		}
	}
}

func cleanPublishers(publishers []ChangePublisher) []ChangePublisher {
	out := make([]ChangePublisher, 0, len(publishers))
	for _, publisher := range publishers {
		if publisher != nil {
			out = append(out, publisher)
		}
	}
	return out
}

func firstNow(now func() time.Time) func() time.Time {
	if now != nil {
		return now
	}
	return func() time.Time { return time.Now().UTC() }
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

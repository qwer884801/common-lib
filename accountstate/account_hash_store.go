package accountstate

import (
	"context"
	"fmt"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	"github.com/redis/go-redis/v9"
)

type AccountHashStore struct {
	store      *HashStore
	descriptor accountmodel.Descriptor
	idField    string
}

type AccountHashStoreConfig struct {
	Client         redis.Cmdable
	Prefix         string
	TTL            time.Duration
	UpdatedAtField string
	Now            func() time.Time
	Descriptor     accountmodel.Descriptor
	IDField        string
}

func NewAccountHashStore(cfg AccountHashStoreConfig) *AccountHashStore {
	return &AccountHashStore{
		store: NewHashStore(HashStoreConfig{
			Client:         cfg.Client,
			Prefix:         cfg.Prefix,
			TTL:            cfg.TTL,
			UpdatedAtField: cfg.UpdatedAtField,
			Now:            cfg.Now,
		}),
		descriptor: cfg.Descriptor,
		idField:    firstNonEmpty(cfg.IDField, "account_id"),
	}
}

func (s *AccountHashStore) Load(ctx context.Context, accountID string, fields ...string) (map[string]string, error) {
	if err := s.configured("account hash state store"); err != nil {
		return nil, err
	}
	key, err := s.key(accountID)
	if err != nil {
		return nil, err
	}
	return s.store.Load(ctx, key, fields...)
}

func (s *AccountHashStore) SavePatch(ctx context.Context, accountID string, values map[string]string) error {
	if err := s.configured("account hash state store"); err != nil {
		return err
	}
	key, err := s.key(accountID)
	if err != nil {
		return err
	}
	return s.store.SavePatch(ctx, key, values)
}

func (s *AccountHashStore) Delete(ctx context.Context, accountID string) error {
	if err := s.configured("account hash state store"); err != nil {
		return err
	}
	key, err := s.key(accountID)
	if err != nil {
		return err
	}
	return s.store.Delete(ctx, key)
}

func (s *AccountHashStore) PreserveMaxInt64(ctx context.Context, accountID string, values map[string]string, fields ...string) error {
	if err := s.configured("account hash state store"); err != nil {
		return err
	}
	key, err := s.key(accountID)
	if err != nil {
		return err
	}
	return s.store.PreserveMaxInt64(ctx, key, values, fields...)
}

func (s *AccountHashStore) key(accountID string) (string, error) {
	return AccountStateKey(s.descriptor, accountID, s.idField)
}

func (s *AccountHashStore) configured(name string) error {
	if s == nil || s.store == nil {
		return fmt.Errorf("%s is not configured", name)
	}
	return nil
}

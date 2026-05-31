package accountstate

import (
	"context"
	"fmt"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	"github.com/byte-v-forge/common-lib/redisx"
	"github.com/redis/go-redis/v9"
)

type AccountJSONStore struct {
	store      *JSONStore
	index      *redisx.StringSetStore
	descriptor accountmodel.Descriptor
	idField    string
}

type AccountJSONRecord struct {
	AccountID string
	Raw       string
}

type AccountJSONPage struct {
	Records    []AccountJSONRecord
	NextCursor string
}

type AccountJSONStoreConfig struct {
	Client     redis.Cmdable
	Prefix     string
	TTL        time.Duration
	Descriptor accountmodel.Descriptor
	IDField    string
}

func NewAccountJSONStore(cfg AccountJSONStoreConfig) *AccountJSONStore {
	return &AccountJSONStore{
		store:      NewJSONStore(JSONStoreConfig{Client: cfg.Client, Prefix: cfg.Prefix, TTL: cfg.TTL}),
		index:      redisx.NewStringSetStore(cfg.Client, cfg.Prefix),
		descriptor: cfg.Descriptor,
		idField:    firstNonEmpty(cfg.IDField, "account_id"),
	}
}

func (s *AccountJSONStore) LoadDefault(ctx context.Context, accountID string, fallback string) (string, error) {
	if err := s.configured("account json state store"); err != nil {
		return "", err
	}
	record, found, err := s.Load(ctx, accountID)
	if err != nil {
		return "", err
	}
	if !found || record.Raw == "" {
		return NormalizeJSON(fallback)
	}
	return record.Raw, nil
}

func (s *AccountJSONStore) Load(ctx context.Context, accountID string) (AccountJSONRecord, bool, error) {
	if err := s.configured("account json state store"); err != nil {
		return AccountJSONRecord{}, false, err
	}
	accountID, key, err := s.accountIDAndKey(accountID)
	if err != nil {
		return AccountJSONRecord{}, false, err
	}
	raw, found, err := s.store.Load(ctx, key)
	if err != nil || !found {
		return AccountJSONRecord{}, found, err
	}
	normalized, err := NormalizeJSON(raw)
	if err != nil {
		return AccountJSONRecord{}, false, err
	}
	return AccountJSONRecord{AccountID: accountID, Raw: normalized}, true, nil
}

func (s *AccountJSONStore) Save(ctx context.Context, accountID string, raw string) (string, error) {
	if err := s.configured("account json state store"); err != nil {
		return "", err
	}
	accountID, key, err := s.accountIDAndKey(accountID)
	if err != nil {
		return "", err
	}
	normalized, err := s.store.Save(ctx, key, raw)
	if err != nil {
		return "", err
	}
	if err := s.index.Add(ctx, s.indexKey(), accountID); err != nil {
		return "", err
	}
	return normalized, nil
}

func (s *AccountJSONStore) Delete(ctx context.Context, accountID string) error {
	if err := s.configured("account json state store"); err != nil {
		return err
	}
	accountID, key, err := s.accountIDAndKey(accountID)
	if err != nil {
		return err
	}
	if err := s.store.Delete(ctx, key); err != nil {
		return err
	}
	return s.index.Remove(ctx, s.indexKey(), accountID)
}

func (s *AccountJSONStore) ListPage(ctx context.Context, cursor string, limit int) (AccountJSONPage, error) {
	if err := s.configured("account json state store"); err != nil {
		return AccountJSONPage{}, err
	}
	nextCursor, err := parseScanCursor(cursor)
	if err != nil {
		return AccountJSONPage{}, err
	}
	limit = accountmodel.NormalizePageLimit(limit)
	records := make([]AccountJSONRecord, 0, limit)
	seen := map[string]struct{}{}
	for scans := 0; len(records) < limit && scans < 8; scans++ {
		accountIDs, cursorValue, err := s.index.ScanPage(ctx, s.indexKey(), nextCursor, int64(limit-len(records)))
		if err != nil {
			return AccountJSONPage{}, err
		}
		nextCursor = cursorValue
		pageRecords, err := s.loadAccountRecords(ctx, accountIDs)
		if err != nil {
			return AccountJSONPage{}, err
		}
		for _, record := range pageRecords {
			if _, exists := seen[record.AccountID]; exists {
				continue
			}
			seen[record.AccountID] = struct{}{}
			records = append(records, record)
			if len(records) >= limit {
				break
			}
		}
		if nextCursor == 0 {
			break
		}
	}
	return AccountJSONPage{Records: records, NextCursor: formatScanCursor(nextCursor)}, nil
}

func (s *AccountJSONStore) NormalizeID(value string) (string, error) {
	if err := s.configured("account json state store"); err != nil {
		return "", err
	}
	return s.descriptor.NormalizeID(value, s.idField)
}

func (s *AccountJSONStore) key(accountID string) (string, error) {
	return AccountStateKey(s.descriptor, accountID, s.idField)
}

func (s *AccountJSONStore) accountIDAndKey(value string) (string, string, error) {
	accountID, err := s.descriptor.NormalizeID(value, s.idField)
	if err != nil {
		return "", "", err
	}
	key, err := AccountStateKey(s.descriptor, accountID, s.idField)
	return accountID, key, err
}

func (s *AccountJSONStore) indexKey() string {
	return AccountStateIndexKey(s.descriptor)
}

func (s *AccountJSONStore) loadAccountRecords(ctx context.Context, accountIDs []string) ([]AccountJSONRecord, error) {
	keys := make([]string, 0, len(accountIDs))
	idByKey := make(map[string]string, len(accountIDs))
	for _, accountID := range accountIDs {
		key, err := s.key(accountID)
		if err != nil {
			continue
		}
		keys = append(keys, key)
		idByKey[key] = accountID
	}
	values, err := s.store.LoadMany(ctx, keys...)
	if err != nil {
		return nil, err
	}
	missing := make([]string, 0, len(accountIDs))
	records := make([]AccountJSONRecord, 0, len(values))
	for _, key := range keys {
		raw, ok := values[key]
		if !ok {
			missing = append(missing, idByKey[key])
			continue
		}
		records = append(records, AccountJSONRecord{AccountID: idByKey[key], Raw: raw})
	}
	if len(missing) > 0 {
		_ = s.index.Remove(ctx, s.indexKey(), missing...)
	}
	return records, nil
}

func (s *AccountJSONStore) configured(name string) error {
	if s == nil || s.store == nil {
		return fmt.Errorf("%s is not configured", name)
	}
	return nil
}

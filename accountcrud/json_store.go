package accountcrud

import (
	"context"
	"fmt"

	"github.com/byte-v-forge/common-lib/accountstate"
)

type AccountJSONStore struct {
	store *accountstate.AccountJSONStore
}

func NewAccountJSONStore(store *accountstate.AccountJSONStore) *AccountJSONStore {
	return &AccountJSONStore{store: store}
}

func (s *AccountJSONStore) List(ctx context.Context, req ListRequest) (Page[accountstate.AccountJSONRecord], error) {
	if err := s.configured(); err != nil {
		return Page[accountstate.AccountJSONRecord]{}, err
	}
	page, err := s.store.ListPage(ctx, req.Cursor, req.Limit)
	if err != nil {
		return Page[accountstate.AccountJSONRecord]{}, err
	}
	return Page[accountstate.AccountJSONRecord]{Records: page.Records, NextCursor: page.NextCursor}, nil
}

func (s *AccountJSONStore) Get(ctx context.Context, accountID string) (accountstate.AccountJSONRecord, bool, error) {
	if err := s.configured(); err != nil {
		return accountstate.AccountJSONRecord{}, false, err
	}
	return s.store.Load(ctx, accountID)
}

func (s *AccountJSONStore) Upsert(ctx context.Context, record accountstate.AccountJSONRecord) (accountstate.AccountJSONRecord, error) {
	if err := s.configured(); err != nil {
		return accountstate.AccountJSONRecord{}, err
	}
	accountID, err := s.store.NormalizeID(record.AccountID)
	if err != nil {
		return accountstate.AccountJSONRecord{}, err
	}
	raw, err := s.store.Save(ctx, accountID, record.Raw)
	if err != nil {
		return accountstate.AccountJSONRecord{}, err
	}
	return accountstate.AccountJSONRecord{AccountID: accountID, Raw: raw}, nil
}

func (s *AccountJSONStore) Delete(ctx context.Context, accountID string) (accountstate.AccountJSONRecord, bool, error) {
	if err := s.configured(); err != nil {
		return accountstate.AccountJSONRecord{}, false, err
	}
	record, found, err := s.store.Load(ctx, accountID)
	if err != nil || !found {
		return accountstate.AccountJSONRecord{}, found, err
	}
	if err := s.store.Delete(ctx, record.AccountID); err != nil {
		return accountstate.AccountJSONRecord{}, false, err
	}
	return record, true, nil
}

func (s *AccountJSONStore) configured() error {
	if s == nil || s.store == nil {
		return fmt.Errorf("account json crud store is not configured")
	}
	return nil
}

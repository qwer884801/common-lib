package accountcrud

import (
	"context"
	"fmt"
)

type MapRecordFunc[S any, T any] func(S) (T, error)

type MappedStoreConfig[S any, T any] struct {
	Store    Store[S]
	ToBase   MapRecordFunc[T, S]
	FromBase MapRecordFunc[S, T]
}

type MappedStore[S any, T any] struct {
	store    Store[S]
	toBase   MapRecordFunc[T, S]
	fromBase MapRecordFunc[S, T]
}

func NewMappedStore[S any, T any](cfg MappedStoreConfig[S, T]) *MappedStore[S, T] {
	return &MappedStore[S, T]{
		store:    cfg.Store,
		toBase:   cfg.ToBase,
		fromBase: cfg.FromBase,
	}
}

func (s *MappedStore[S, T]) List(ctx context.Context, req ListRequest) (Page[T], error) {
	if err := s.configured(false); err != nil {
		return Page[T]{}, err
	}
	page, err := s.store.List(ctx, req)
	if err != nil {
		return Page[T]{}, err
	}
	return MapPage(page, s.fromBase)
}

func (s *MappedStore[S, T]) Get(ctx context.Context, accountID string) (T, bool, error) {
	var zero T
	if err := s.configured(false); err != nil {
		return zero, false, err
	}
	record, found, err := s.store.Get(ctx, accountID)
	if err != nil || !found {
		return zero, found, err
	}
	mapped, err := s.fromBase(record)
	return mapped, true, err
}

func (s *MappedStore[S, T]) Upsert(ctx context.Context, record T) (T, error) {
	var zero T
	if err := s.configured(true); err != nil {
		return zero, err
	}
	baseRecord, err := s.toBase(record)
	if err != nil {
		return zero, err
	}
	stored, err := s.store.Upsert(ctx, baseRecord)
	if err != nil {
		return zero, err
	}
	return s.fromBase(stored)
}

func (s *MappedStore[S, T]) Delete(ctx context.Context, accountID string) (T, bool, error) {
	var zero T
	if err := s.configured(false); err != nil {
		return zero, false, err
	}
	record, found, err := s.store.Delete(ctx, accountID)
	if err != nil || !found {
		return zero, found, err
	}
	mapped, err := s.fromBase(record)
	return mapped, true, err
}

func MapPage[S any, T any](page Page[S], mapRecord MapRecordFunc[S, T]) (Page[T], error) {
	if mapRecord == nil {
		return Page[T]{}, fmt.Errorf("account page mapper is not configured")
	}
	records := make([]T, 0, len(page.Records))
	for _, record := range page.Records {
		mapped, err := mapRecord(record)
		if err != nil {
			return Page[T]{}, err
		}
		records = append(records, mapped)
	}
	return Page[T]{Records: records, NextCursor: page.NextCursor}, nil
}

func (s *MappedStore[S, T]) configured(requireToBase bool) error {
	if s == nil || s.store == nil {
		return fmt.Errorf("mapped account store is not configured")
	}
	if s.fromBase == nil {
		return fmt.Errorf("mapped account store from-base mapper is not configured")
	}
	if requireToBase && s.toBase == nil {
		return fmt.Errorf("mapped account store to-base mapper is not configured")
	}
	return nil
}

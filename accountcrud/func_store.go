package accountcrud

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

type ListFunc[T any] func(context.Context, ListRequest) (Page[T], error)
type GetFunc[T any] func(context.Context, string) (T, bool, error)
type UpsertFunc[T any] func(context.Context, T) (T, error)
type DeleteFunc[T any] func(context.Context, string) (T, bool, error)

type StoreFuncs[T any] struct {
	ListFunc   ListFunc[T]
	GetFunc    GetFunc[T]
	UpsertFunc UpsertFunc[T]
	DeleteFunc DeleteFunc[T]
	Name       string
}

func (s StoreFuncs[T]) List(ctx context.Context, req ListRequest) (Page[T], error) {
	if s.ListFunc == nil {
		return Page[T]{}, s.missing("list")
	}
	return s.ListFunc(ctx, req)
}

func (s StoreFuncs[T]) Get(ctx context.Context, accountID string) (T, bool, error) {
	var zero T
	if s.GetFunc == nil {
		return zero, false, s.missing("get")
	}
	return s.GetFunc(ctx, accountID)
}

func (s StoreFuncs[T]) Upsert(ctx context.Context, record T) (T, error) {
	var zero T
	if s.UpsertFunc == nil {
		return zero, s.missing("upsert")
	}
	return s.UpsertFunc(ctx, record)
}

func (s StoreFuncs[T]) Delete(ctx context.Context, accountID string) (T, bool, error) {
	var zero T
	if s.DeleteFunc == nil {
		return zero, false, s.missing("delete")
	}
	return s.DeleteFunc(ctx, accountID)
}

func (s StoreFuncs[T]) missing(operation string) error {
	name := strings.TrimSpace(s.Name)
	if name == "" {
		name = "account store"
	}
	return fmt.Errorf("%s %s function is not configured", name, operation)
}

func UnsupportedDelete[T any](message string) DeleteFunc[T] {
	message = strings.TrimSpace(message)
	if message == "" {
		message = "account delete is not supported"
	}
	return func(context.Context, string) (T, bool, error) {
		var zero T
		return zero, false, errors.New(message)
	}
}

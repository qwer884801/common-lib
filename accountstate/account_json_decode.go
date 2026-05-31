package accountstate

import "fmt"

type AccountJSONDecoder[T any] func(accountID string, raw string) (T, error)

type AccountStateRecord[T any] struct {
	AccountID string
	State     T
}

type AccountStatePage[T any] struct {
	Records    []AccountStateRecord[T]
	NextCursor string
}

func DecodeAccountJSONPage[T any](page AccountJSONPage, decode AccountJSONDecoder[T]) (AccountStatePage[T], error) {
	records, err := DecodeAccountJSONRecords(page.Records, decode)
	if err != nil {
		return AccountStatePage[T]{}, err
	}
	return AccountStatePage[T]{Records: records, NextCursor: page.NextCursor}, nil
}

func DecodeAccountJSONRecords[T any](records []AccountJSONRecord, decode AccountJSONDecoder[T]) ([]AccountStateRecord[T], error) {
	if decode == nil {
		return nil, fmt.Errorf("account json decoder is required")
	}
	out := make([]AccountStateRecord[T], 0, len(records))
	for _, record := range records {
		state, err := decode(record.AccountID, record.Raw)
		if err != nil {
			return nil, err
		}
		out = append(out, AccountStateRecord[T]{AccountID: record.AccountID, State: state})
	}
	return out, nil
}

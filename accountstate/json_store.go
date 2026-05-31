package accountstate

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/redisx"
	"github.com/redis/go-redis/v9"
)

type JSONStore struct {
	store *redisx.StringStore
}

type JSONStoreConfig struct {
	Client redis.Cmdable
	Prefix string
	TTL    time.Duration
}

func NewJSONStore(cfg JSONStoreConfig) *JSONStore {
	return &JSONStore{store: redisx.NewStringStore(cfg.Client, cfg.Prefix, cfg.TTL)}
}

func (s *JSONStore) Load(ctx context.Context, key string) (string, bool, error) {
	if s == nil || s.store == nil {
		return "", false, fmt.Errorf("account json state store is not configured")
	}
	return s.store.Load(ctx, strings.TrimSpace(key))
}

func (s *JSONStore) LoadDefault(ctx context.Context, key string, fallback string) (string, error) {
	value, found, err := s.Load(ctx, key)
	if err != nil {
		return "", err
	}
	if !found || strings.TrimSpace(value) == "" {
		return NormalizeJSON(fallback)
	}
	return NormalizeJSON(value)
}

func (s *JSONStore) LoadMany(ctx context.Context, keys ...string) (map[string]string, error) {
	if s == nil || s.store == nil {
		return nil, fmt.Errorf("account json state store is not configured")
	}
	values, err := s.store.LoadMany(ctx, cleanJSONKeys(keys)...)
	if err != nil {
		return nil, err
	}
	out := make(map[string]string, len(values))
	for key, value := range values {
		normalized, err := NormalizeJSON(value)
		if err != nil {
			return nil, err
		}
		out[key] = normalized
	}
	return out, nil
}

func (s *JSONStore) Save(ctx context.Context, key string, raw string) (string, error) {
	if s == nil || s.store == nil {
		return "", fmt.Errorf("account json state store is not configured")
	}
	normalized, err := NormalizeJSON(raw)
	if err != nil {
		return "", err
	}
	if err := s.store.Save(ctx, strings.TrimSpace(key), normalized); err != nil {
		return "", err
	}
	return normalized, nil
}

func (s *JSONStore) Delete(ctx context.Context, key string) error {
	if s == nil || s.store == nil {
		return nil
	}
	return s.store.Delete(ctx, strings.TrimSpace(key))
}

func NormalizeJSON(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		raw = "{}"
	}
	var value map[string]any
	if err := json.Unmarshal([]byte(raw), &value); err != nil {
		return "", err
	}
	if value == nil {
		value = map[string]any{}
	}
	data, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func cleanJSONKeys(keys []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(keys))
	for _, key := range keys {
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, key)
	}
	return out
}

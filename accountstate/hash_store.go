package accountstate

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/redisx"
	"github.com/redis/go-redis/v9"
)

const DefaultUpdatedAtField = "updated_at_unix"

type HashStore struct {
	store          *redisx.StringStore
	updatedAtField string
	now            func() time.Time
}

type HashStoreConfig struct {
	Client         redis.Cmdable
	Prefix         string
	TTL            time.Duration
	UpdatedAtField string
	Now            func() time.Time
}

func NewHashStore(cfg HashStoreConfig) *HashStore {
	updatedAtField := strings.TrimSpace(cfg.UpdatedAtField)
	if updatedAtField == "" {
		updatedAtField = DefaultUpdatedAtField
	}
	now := cfg.Now
	if now == nil {
		now = time.Now
	}
	return &HashStore{
		store:          redisx.NewStringStore(cfg.Client, cfg.Prefix, cfg.TTL),
		updatedAtField: updatedAtField,
		now:            now,
	}
}

func (s *HashStore) Load(ctx context.Context, key string, fields ...string) (map[string]string, error) {
	if s == nil || s.store == nil {
		return map[string]string{}, nil
	}
	return s.store.HashLoadMany(ctx, hashKey(key), fields...)
}

func (s *HashStore) SavePatch(ctx context.Context, key string, values map[string]string) error {
	if s == nil || s.store == nil {
		return fmt.Errorf("account hash state store is not configured")
	}
	clean := CleanPatch(values)
	if len(clean) == 0 {
		return nil
	}
	if s.updatedAtField != "" {
		clean[s.updatedAtField] = strconv.FormatInt(s.now().UTC().Unix(), 10)
	}
	return s.store.HashSaveTTL(ctx, hashKey(key), clean, 0)
}

func (s *HashStore) Delete(ctx context.Context, key string) error {
	if s == nil || s.store == nil {
		return nil
	}
	return s.store.Delete(ctx, hashKey(key))
}

func (s *HashStore) PreserveMaxInt64(ctx context.Context, key string, values map[string]string, fields ...string) error {
	if s == nil || s.store == nil || len(values) == 0 {
		return nil
	}
	cleanFields := CleanFields(fields)
	if len(cleanFields) == 0 {
		return nil
	}
	existing, err := s.Load(ctx, key, cleanFields...)
	if err != nil {
		return err
	}
	for _, field := range cleanFields {
		candidate := int64Value(values[field])
		current := int64Value(existing[field])
		if current > candidate {
			values[field] = strconv.FormatInt(current, 10)
		}
	}
	return nil
}

func CleanPatch(values map[string]string) map[string]string {
	out := map[string]string{}
	for key, value := range values {
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		out[key] = strings.TrimSpace(value)
	}
	return out
}

func CleanFields(fields []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(fields))
	for _, field := range fields {
		field = strings.TrimSpace(field)
		if field == "" {
			continue
		}
		if _, exists := seen[field]; exists {
			continue
		}
		seen[field] = struct{}{}
		out = append(out, field)
	}
	return out
}

func hashKey(key string) string {
	return strings.TrimSpace(key)
}

func int64Value(value string) int64 {
	out, _ := strconv.ParseInt(strings.TrimSpace(value), 10, 64)
	return out
}

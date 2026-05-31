package accountstate

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/byte-v-forge/common-lib/accountmodel"
)

const AccountStateKeyPrefix = "account:"
const AccountStateIndexKeyPrefix = "account_index:"

func AccountStateKey(descriptor accountmodel.Descriptor, accountID string, idField string) (string, error) {
	accountID, err := descriptor.NormalizeID(accountID, firstNonEmpty(idField, "account_id"))
	if err != nil {
		return "", err
	}
	key := descriptor.Key(accountID)
	if err := accountmodel.ValidateKey(key); err != nil {
		return "", err
	}
	return AccountStateKeyPrefix + accountmodel.KeyString(key), nil
}

func AccountStateIndexKey(descriptor accountmodel.Descriptor) string {
	parts := []string{descriptor.SourceService, descriptor.AccountType}
	for idx, part := range parts {
		parts[idx] = strings.TrimSpace(part)
	}
	return AccountStateIndexKeyPrefix + strings.Join(parts, ":")
}

func parseScanCursor(value string) (uint64, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, nil
	}
	cursor, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid account cursor")
	}
	return cursor, nil
}

func formatScanCursor(cursor uint64) string {
	if cursor == 0 {
		return ""
	}
	return strconv.FormatUint(cursor, 10)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

package accountstate

import (
	"strconv"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

func CredentialPresentField(kind string) string {
	return credentialField(kind, "present")
}

func CredentialStatusField(kind string) string {
	return credentialField(kind, "status")
}

func CredentialUpdatedAtField(kind string) string {
	return credentialField(kind, "updated_at_unix")
}

func CredentialExpiresAtField(kind string) string {
	return credentialField(kind, "expires_at_unix")
}

func CredentialFields(kind string) []string {
	if strings.TrimSpace(kind) == "" {
		return nil
	}
	return []string{CredentialPresentField(kind), CredentialStatusField(kind), CredentialUpdatedAtField(kind), CredentialExpiresAtField(kind)}
}

func StatusFields() []string {
	return []string{FieldStatus, FieldErrorCode, FieldErrorMessage, FieldErrorRetry, FieldUpdatedAtUnix}
}

func HasAny(values map[string]string, fields ...string) bool {
	for _, field := range fields {
		field = strings.TrimSpace(field)
		if field == "" {
			continue
		}
		if _, ok := values[field]; ok {
			return true
		}
	}
	return false
}

func HasCredential(values map[string]string, kind string) bool {
	return HasAny(values, CredentialFields(kind)...)
}

func OptionalBool(values map[string]string, field string) *bool {
	raw, ok := values[strings.TrimSpace(field)]
	if !ok {
		return nil
	}
	value, err := strconv.ParseBool(strings.TrimSpace(raw))
	if err != nil {
		return nil
	}
	return &value
}

func OptionalString(values map[string]string, field string) *string {
	raw, ok := values[strings.TrimSpace(field)]
	if !ok {
		return nil
	}
	value := strings.TrimSpace(raw)
	return &value
}

func BoolValue(values map[string]string, field string) bool {
	value, _ := strconv.ParseBool(strings.TrimSpace(values[strings.TrimSpace(field)]))
	return value
}

func Int64Value(values map[string]string, field string) int64 {
	value, _ := strconv.ParseInt(strings.TrimSpace(values[strings.TrimSpace(field)]), 10, 64)
	return value
}

func StringValue(values map[string]string, field string) string {
	return strings.TrimSpace(values[strings.TrimSpace(field)])
}

func StringDefault(values map[string]string, field string, fallback string) string {
	value := StringValue(values, field)
	if value == "" {
		return fallback
	}
	return value
}

func TimeValue(values map[string]string, field string) time.Time {
	return accountmodel.UnixTime(Int64Value(values, field))
}

func CredentialState(kind string, values map[string]string) *accountv1.AccountCredentialState {
	kind = strings.TrimSpace(kind)
	if kind == "" || !HasCredential(values, kind) {
		return nil
	}
	return accountmodel.Credential(
		kind,
		BoolValue(values, CredentialPresentField(kind)),
		values[CredentialStatusField(kind)],
		TimeValue(values, CredentialExpiresAtField(kind)),
		TimeValue(values, CredentialUpdatedAtField(kind)),
	)
}

func credentialField(kind string, suffix string) string {
	kind = strings.Trim(strings.TrimSpace(kind), ".")
	suffix = strings.Trim(strings.TrimSpace(suffix), ".")
	if kind == "" || suffix == "" {
		return ""
	}
	return "credential." + kind + "." + suffix
}

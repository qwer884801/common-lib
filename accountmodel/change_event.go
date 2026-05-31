package accountmodel

import (
	"fmt"
	"strings"
	"time"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

const (
	EventAccountUpserted          = "account.upserted"
	EventAccountUpdated           = "account.updated"
	EventAccountDeleted           = "account.deleted"
	EventAccountStatusChanged     = "account.status_changed"
	EventAccountCredentialChanged = "account.credential_changed"
)

type AccountChangeMetadata struct {
	Kind          accountv1.AccountChangeKind
	KindName      string
	EventType     string
	SourceService string
	AccountType   string
	AccountID     string
	ProviderKey   string
	Status        string
	ResourceType  string
	ResourceID    string
	Scope         string
	CorrelationID string
	OccurredAt    time.Time
	Attributes    map[string]string
}

func ChangeMetadata(kind accountv1.AccountChangeKind, account *accountv1.Account, sourceService string, observedAt time.Time) AccountChangeMetadata {
	kind = NormalizeChangeKind(kind)
	key := account.GetKey()
	accountID := strings.TrimSpace(key.GetAccountId())
	accountType := strings.TrimSpace(key.GetAccountType())
	source := firstNonEmpty(sourceService, key.GetSourceService())
	status := StatusValue(account)
	metadata := AccountChangeMetadata{
		Kind:          kind,
		KindName:      ChangeKindName(kind),
		EventType:     ChangeEventType(kind),
		SourceService: source,
		AccountType:   accountType,
		AccountID:     accountID,
		ProviderKey:   strings.TrimSpace(account.GetProviderKey()),
		Status:        status,
		ResourceType:  ChangeResourceType(key),
		ResourceID:    accountID,
		Scope:         status,
		CorrelationID: accountID,
		OccurredAt:    ChangeOccurredAt(account, observedAt),
	}
	metadata.Attributes = ChangeAttributes(metadata)
	return metadata
}

func NormalizeChangeKind(kind accountv1.AccountChangeKind) accountv1.AccountChangeKind {
	if kind != accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UNSPECIFIED {
		return kind
	}
	return accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPDATED
}

func ChangeKindName(kind accountv1.AccountChangeKind) string {
	return NormalizeChangeKind(kind).String()
}

func ChangeEventType(kind accountv1.AccountChangeKind) string {
	switch NormalizeChangeKind(kind) {
	case accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_UPSERTED:
		return EventAccountUpserted
	case accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_DELETED:
		return EventAccountDeleted
	case accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_STATUS_CHANGED:
		return EventAccountStatusChanged
	case accountv1.AccountChangeKind_ACCOUNT_CHANGE_KIND_CREDENTIAL_CHANGED:
		return EventAccountCredentialChanged
	default:
		return EventAccountUpdated
	}
}

func ChangeResourceType(key *accountv1.AccountKey) string {
	if key == nil {
		return AccountResourceType
	}
	accountType := strings.TrimSpace(key.GetAccountType())
	if accountType == "" {
		return AccountResourceType
	}
	source := strings.TrimSpace(key.GetSourceService())
	if source == "" {
		return accountType
	}
	return source + "." + accountType
}

func ChangeOccurredAt(account *accountv1.Account, fallback time.Time) time.Time {
	if account != nil {
		if ts := account.GetUpdatedAt(); ts != nil {
			if value := ts.AsTime(); !value.IsZero() {
				return value.UTC()
			}
		}
	}
	if fallback.IsZero() {
		return time.Now().UTC()
	}
	return fallback.UTC()
}

func ChangeAttributes(metadata AccountChangeMetadata) map[string]string {
	attrs := map[string]string{}
	putNonEmpty(attrs, "change_kind", metadata.KindName)
	putNonEmpty(attrs, "source_service", metadata.SourceService)
	putNonEmpty(attrs, "account_type", metadata.AccountType)
	putNonEmpty(attrs, "account_id", metadata.AccountID)
	putNonEmpty(attrs, "provider_key", metadata.ProviderKey)
	putNonEmpty(attrs, "status", metadata.Status)
	if len(attrs) == 0 {
		return nil
	}
	return attrs
}

func (m AccountChangeMetadata) EventIDParts() []string {
	return []string{m.EventType, m.SourceService, m.AccountType, m.AccountID, fmt.Sprintf("%d", m.OccurredAt.UnixNano())}
}

func putNonEmpty(attrs map[string]string, key string, value string) {
	key = strings.TrimSpace(key)
	value = strings.TrimSpace(value)
	if key != "" && value != "" {
		attrs[key] = value
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

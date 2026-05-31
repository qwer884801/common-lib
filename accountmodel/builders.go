package accountmodel

import (
	"fmt"
	"strings"
	"time"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const AccountResourceType = "account"

type AccountOption func(*accountv1.Account)

func Account(key *accountv1.AccountKey, options ...AccountOption) *accountv1.Account {
	account := &accountv1.Account{Key: key}
	for _, option := range options {
		if option != nil {
			option(account)
		}
	}
	return account
}

func Key(sourceService string, accountType string, accountID string) *accountv1.AccountKey {
	return &accountv1.AccountKey{
		SourceService: strings.TrimSpace(sourceService),
		AccountType:   strings.TrimSpace(accountType),
		AccountId:     strings.TrimSpace(accountID),
	}
}

func ValidateKey(key *accountv1.AccountKey) error {
	if key == nil {
		return fmt.Errorf("account key is required")
	}
	if strings.TrimSpace(key.GetSourceService()) == "" {
		return fmt.Errorf("account source_service is required")
	}
	if strings.TrimSpace(key.GetAccountType()) == "" {
		return fmt.Errorf("account account_type is required")
	}
	if _, err := NormalizeAccountIDField(key.GetAccountId(), "account account_id"); err != nil {
		return err
	}
	return nil
}

func KeyString(key *accountv1.AccountKey) string {
	if key == nil {
		return ""
	}
	parts := []string{key.GetSourceService(), key.GetAccountType(), key.GetAccountId()}
	for idx, part := range parts {
		parts[idx] = strings.TrimSpace(part)
	}
	if parts[0] == "" || parts[1] == "" || parts[2] == "" {
		return ""
	}
	return strings.Join(parts, ":")
}

func WithProviderKey(providerKey string) AccountOption {
	return func(account *accountv1.Account) {
		account.ProviderKey = strings.TrimSpace(providerKey)
	}
}

func WithDisplayName(displayName string) AccountOption {
	return func(account *accountv1.Account) {
		account.DisplayName = strings.TrimSpace(displayName)
	}
}

func WithSubject(subject *accountv1.AccountSubject) AccountOption {
	return func(account *accountv1.Account) {
		account.Subject = subject
	}
}

func WithStatus(status *accountv1.AccountStatus) AccountOption {
	return func(account *accountv1.Account) {
		account.Status = status
	}
}

func WithCredentials(credentials ...*accountv1.AccountCredentialState) AccountOption {
	return func(account *accountv1.Account) {
		account.CredentialStates = credentials
	}
}

func WithCreatedAt(createdAt time.Time) AccountOption {
	return func(account *accountv1.Account) {
		account.CreatedAt = Timestamp(createdAt)
	}
}

func WithCreatedTimestamp(createdAt *timestamppb.Timestamp) AccountOption {
	return func(account *accountv1.Account) {
		account.CreatedAt = createdAt
	}
}

func WithUpdatedAt(updatedAt time.Time) AccountOption {
	return func(account *accountv1.Account) {
		account.UpdatedAt = Timestamp(updatedAt)
	}
}

func WithUpdatedTimestamp(updatedAt *timestamppb.Timestamp) AccountOption {
	return func(account *accountv1.Account) {
		account.UpdatedAt = updatedAt
	}
}

func EmailSubject(email string, display string) *accountv1.AccountSubject {
	return &accountv1.AccountSubject{Value: &accountv1.AccountSubject_Email{Email: strings.TrimSpace(email)}, Display: strings.TrimSpace(display)}
}

func PhoneSubject(phoneE164 string, display string) *accountv1.AccountSubject {
	return &accountv1.AccountSubject{Value: &accountv1.AccountSubject_PhoneE164{PhoneE164: strings.TrimSpace(phoneE164)}, Display: strings.TrimSpace(display)}
}

func ExternalSubject(externalID string, display string) *accountv1.AccountSubject {
	return &accountv1.AccountSubject{Value: &accountv1.AccountSubject_ExternalId{ExternalId: strings.TrimSpace(externalID)}, Display: strings.TrimSpace(display)}
}

func Status(value string, label string, accountErr *accountv1.AccountError) *accountv1.AccountStatus {
	return &accountv1.AccountStatus{Value: strings.TrimSpace(value), Label: strings.TrimSpace(label), Error: accountErr}
}

func Error(code string, message string, retryable bool) *accountv1.AccountError {
	return &accountv1.AccountError{Code: strings.TrimSpace(code), Message: strings.TrimSpace(message), Retryable: retryable}
}

func Credential(kind string, present bool, status string, expiresAt time.Time, updatedAt time.Time) *accountv1.AccountCredentialState {
	return &accountv1.AccountCredentialState{
		Kind:      strings.TrimSpace(kind),
		Present:   present,
		Status:    strings.TrimSpace(status),
		ExpiresAt: timestamp(expiresAt),
		UpdatedAt: timestamp(updatedAt),
	}
}

func CredentialState(account *accountv1.Account, kind string) *accountv1.AccountCredentialState {
	if account == nil {
		return nil
	}
	kind = strings.TrimSpace(kind)
	if kind == "" {
		return nil
	}
	for _, credential := range account.GetCredentialStates() {
		if strings.TrimSpace(credential.GetKind()) == kind {
			return credential
		}
	}
	return nil
}

func SetCredentialState(account *accountv1.Account, kind string, present bool, status string, expiresAt time.Time, updatedAt time.Time) {
	UpsertCredentialState(account, Credential(kind, present, status, expiresAt, updatedAt))
}

func UpsertCredentialState(account *accountv1.Account, credential *accountv1.AccountCredentialState) {
	if account == nil || credential == nil {
		return
	}
	kind := strings.TrimSpace(credential.GetKind())
	if kind == "" {
		return
	}
	credential.Kind = kind
	for idx, existing := range account.CredentialStates {
		if strings.TrimSpace(existing.GetKind()) == kind {
			account.CredentialStates[idx] = credential
			return
		}
	}
	account.CredentialStates = append(account.CredentialStates, credential)
}

func Timestamp(value time.Time) *timestamppb.Timestamp {
	return timestamp(value)
}

func UnixTimestamp(value int64) *timestamppb.Timestamp {
	if value <= 0 {
		return nil
	}
	return timestamppb.New(time.Unix(value, 0).UTC())
}

func UnixTime(value int64) time.Time {
	if value <= 0 {
		return time.Time{}
	}
	return time.Unix(value, 0).UTC()
}

func timestamp(value time.Time) *timestamppb.Timestamp {
	if value.IsZero() {
		return nil
	}
	return timestamppb.New(value.UTC())
}

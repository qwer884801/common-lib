package accountmodel

import (
	"fmt"
	"strings"
	"time"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type Descriptor struct {
	SourceService string
	AccountType   string
	ProviderKey   string
}

func (d Descriptor) Key(accountID string) *accountv1.AccountKey {
	return Key(d.SourceService, d.AccountType, accountID)
}

func (d Descriptor) Account(accountID string, options ...AccountOption) *accountv1.Account {
	accountOptions := make([]AccountOption, 0, len(options)+1)
	if strings.TrimSpace(d.ProviderKey) != "" {
		accountOptions = append(accountOptions, WithProviderKey(d.ProviderKey))
	}
	accountOptions = append(accountOptions, options...)
	return Account(d.Key(accountID), accountOptions...)
}

func (d Descriptor) Tombstone(accountID string, updatedAt time.Time) *accountv1.Account {
	return d.Account(accountID, WithUpdatedAt(updatedAt))
}

func (d Descriptor) NormalizeID(value string, field string) (string, error) {
	return NormalizeAccountIDField(value, field)
}

func AccountID(account *accountv1.Account) string {
	return strings.TrimSpace(account.GetKey().GetAccountId())
}

func WithEmailIdentity(email string, display string) AccountOption {
	return func(account *accountv1.Account) {
		email = strings.TrimSpace(email)
		display = strings.TrimSpace(display)
		account.DisplayName = display
		account.Subject = EmailSubject(email, display)
	}
}

func WithPhoneIdentity(phoneE164 string, display string) AccountOption {
	return func(account *accountv1.Account) {
		phoneE164 = strings.TrimSpace(phoneE164)
		display = strings.TrimSpace(display)
		account.DisplayName = display
		account.Subject = PhoneSubject(phoneE164, display)
	}
}

func StatusFromStringer(value fmt.Stringer, prefix string) *accountv1.AccountStatus {
	statusValue := NormalizeStatusValue(value.String(), prefix)
	return Status(statusValue, StatusLabel(statusValue), nil)
}

func NormalizeStatusValue(value string, prefix string) string {
	value = strings.TrimSpace(value)
	if prefix != "" {
		value = strings.TrimPrefix(value, prefix)
	}
	return strings.ToLower(value)
}

func StatusLabel(value string) string {
	return strings.ReplaceAll(strings.TrimSpace(value), "_", " ")
}

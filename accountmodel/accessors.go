package accountmodel

import (
	"strings"
	"time"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func SubjectEmail(account *accountv1.Account) string {
	return strings.ToLower(strings.TrimSpace(account.GetSubject().GetEmail()))
}

func SubjectPhone(account *accountv1.Account) string {
	return strings.TrimSpace(account.GetSubject().GetPhoneE164())
}

func SubjectExternalID(account *accountv1.Account) string {
	return strings.TrimSpace(account.GetSubject().GetExternalId())
}

func StatusValue(account *accountv1.Account) string {
	return strings.TrimSpace(account.GetStatus().GetValue())
}

func ErrorMessage(account *accountv1.Account) string {
	return strings.TrimSpace(account.GetStatus().GetError().GetMessage())
}

func CreatedAtUnix(account *accountv1.Account) int64 {
	return TimestampUnix(account.GetCreatedAt())
}

func UpdatedAtUnix(account *accountv1.Account) int64 {
	return TimestampUnix(account.GetUpdatedAt())
}

func TimestampUnix(value *timestamppb.Timestamp) int64 {
	if value == nil {
		return 0
	}
	at := value.AsTime()
	if at.IsZero() {
		return 0
	}
	return at.UTC().Unix()
}

func TimestampTime(value *timestamppb.Timestamp) time.Time {
	if value == nil {
		return time.Time{}
	}
	return value.AsTime().UTC()
}

func CredentialUpdatedAtUnix(account *accountv1.Account, kind string) int64 {
	return TimestampUnix(CredentialState(account, kind).GetUpdatedAt())
}

func SetUpdatedAtUnixMax(account *accountv1.Account, value int64) {
	if account == nil || value <= 0 {
		return
	}
	if value > UpdatedAtUnix(account) {
		account.UpdatedAt = UnixTimestamp(value)
	}
}

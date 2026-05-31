package accountstate

import (
	"strings"

	"github.com/byte-v-forge/common-lib/accountmodel"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type StatusSnapshot struct {
	Status        *accountv1.AccountStatus
	Credentials   []*accountv1.AccountCredentialState
	UpdatedAtUnix int64
}

func StatusSnapshotFromValues(values map[string]string, credentialKinds ...string) StatusSnapshot {
	return StatusSnapshot{
		Status:        AccountStatusFromValues(values),
		Credentials:   CredentialStatesFromValues(values, credentialKinds...),
		UpdatedAtUnix: Int64Value(values, FieldUpdatedAtUnix),
	}
}

func AccountStatusFromValues(values map[string]string) *accountv1.AccountStatus {
	status := StringValue(values, FieldStatus)
	message := StringValue(values, FieldErrorMessage)
	if status == "" && message == "" {
		return nil
	}
	return accountmodel.StatusWithError(
		status,
		accountmodel.StatusLabel(status),
		StringValue(values, FieldErrorCode),
		message,
		BoolValue(values, FieldErrorRetry),
	)
}

func CredentialStatesFromValues(values map[string]string, kinds ...string) []*accountv1.AccountCredentialState {
	out := make([]*accountv1.AccountCredentialState, 0, len(kinds))
	seen := map[string]struct{}{}
	for _, kind := range kinds {
		kind = strings.TrimSpace(kind)
		if kind == "" {
			continue
		}
		if _, exists := seen[kind]; exists {
			continue
		}
		seen[kind] = struct{}{}
		if credential := CredentialState(kind, values); credential != nil {
			out = append(out, credential)
		}
	}
	return out
}

func ApplyStatusSnapshot(account *accountv1.Account, snapshot StatusSnapshot) {
	if account == nil {
		return
	}
	if snapshot.Status != nil {
		account.Status = snapshot.Status
	}
	for _, credential := range snapshot.Credentials {
		accountmodel.UpsertCredentialState(account, credential)
	}
	if snapshot.UpdatedAtUnix > 0 {
		account.UpdatedAt = accountmodel.UnixTimestamp(snapshot.UpdatedAtUnix)
	}
}

package accountmodel

import (
	"strings"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

const (
	CredentialKindAccessToken  = "access_token"
	CredentialKindMailbox      = "mailbox"
	CredentialKindPIN          = "pin"
	CredentialKindSessionToken = "session_token"
	CredentialKindToken        = "token"

	CredentialStatusConfigured  = "configured"
	CredentialStatusFetched     = "fetched"
	CredentialStatusMessageSeen = "message_seen"
)

func StatusWithError(value string, label string, code string, message string, retryable bool) *accountv1.AccountStatus {
	if strings.TrimSpace(message) == "" {
		return Status(value, label, nil)
	}
	return Status(value, label, Error(code, message, retryable))
}

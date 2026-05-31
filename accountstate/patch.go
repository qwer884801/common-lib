package accountstate

import (
	"strconv"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/accountmodel"
	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

const (
	FieldStatus        = "status"
	FieldErrorCode     = "error_code"
	FieldErrorMessage  = "error_message"
	FieldErrorRetry    = "error_retryable"
	FieldUpdatedAtUnix = DefaultUpdatedAtField
)

type Patch map[string]string

func NewPatch() Patch {
	return Patch{}
}

func (p Patch) Values() map[string]string {
	return map[string]string(p)
}

func (p Patch) Set(field string, value string) Patch {
	p = p.ensure()
	field = strings.TrimSpace(field)
	if field != "" {
		p[field] = strings.TrimSpace(value)
	}
	return p
}

func (p Patch) SetNonEmpty(field string, value string) Patch {
	if strings.TrimSpace(value) == "" {
		return p
	}
	return p.Set(field, value)
}

func (p Patch) SetBool(field string, value bool) Patch {
	return p.Set(field, strconv.FormatBool(value))
}

func (p Patch) SetOptionalBool(field string, value *bool) Patch {
	if value == nil {
		return p
	}
	return p.SetBool(field, *value)
}

func (p Patch) SetOptionalString(field string, value *string) Patch {
	if value == nil {
		return p
	}
	return p.Set(field, *value)
}

func (p Patch) SetInt64(field string, value int64) Patch {
	return p.Set(field, strconv.FormatInt(value, 10))
}

func (p Patch) SetPositiveInt64(field string, value int64) Patch {
	if value <= 0 {
		return p
	}
	return p.SetInt64(field, value)
}

func (p Patch) SetTimeUnix(field string, value time.Time) Patch {
	if value.IsZero() {
		return p
	}
	return p.SetInt64(field, value.UTC().Unix())
}

func (p Patch) SetStatus(status string, errorMessage string) Patch {
	status = strings.TrimSpace(status)
	errorMessage = strings.TrimSpace(errorMessage)
	if status != "" {
		return p.Set(FieldStatus, status).Set(FieldErrorMessage, errorMessage)
	}
	return p.SetNonEmpty(FieldErrorMessage, errorMessage)
}

func (p Patch) SetError(code string, message string, retryable bool) Patch {
	message = strings.TrimSpace(message)
	if message == "" {
		return p.Set(FieldErrorCode, "").Set(FieldErrorMessage, "").SetBool(FieldErrorRetry, false)
	}
	return p.Set(FieldErrorCode, code).Set(FieldErrorMessage, message).SetBool(FieldErrorRetry, retryable)
}

func (p Patch) SetStatusError(status string, code string, message string, retryable bool) Patch {
	return p.SetStatus(status, message).SetError(code, message, retryable)
}

func (p Patch) SetCredential(kind string, present bool, status string, updatedAt time.Time) Patch {
	kind = strings.TrimSpace(kind)
	if kind == "" {
		return p
	}
	p.SetBool(CredentialPresentField(kind), present)
	p.SetNonEmpty(CredentialStatusField(kind), status)
	p.SetTimeUnix(CredentialUpdatedAtField(kind), updatedAt)
	return p
}

func (p Patch) SetCredentialExpiresAt(kind string, expiresAt time.Time) Patch {
	kind = strings.TrimSpace(kind)
	if kind == "" {
		return p
	}
	return p.SetTimeUnix(CredentialExpiresAtField(kind), expiresAt)
}

func (p Patch) SetCredentialState(kind string, credential *accountv1.AccountCredentialState) Patch {
	if credential == nil {
		return p
	}
	kind = firstNonEmpty(kind, credential.GetKind())
	return p.SetCredential(kind, credential.GetPresent(), credential.GetStatus(), accountmodel.TimestampTime(credential.GetUpdatedAt())).
		SetCredentialExpiresAt(kind, accountmodel.TimestampTime(credential.GetExpiresAt()))
}

func (p Patch) ensure() Patch {
	if p == nil {
		return NewPatch()
	}
	return p
}

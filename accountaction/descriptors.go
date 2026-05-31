package accountaction

import (
	"strings"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type Option func(*accountv1.AccountActionDescriptor)

func Descriptor(actionID string, label string, options ...Option) *accountv1.AccountActionDescriptor {
	d := &accountv1.AccountActionDescriptor{
		ActionId: strings.TrimSpace(actionID),
		Label:    strings.TrimSpace(label),
		Tone:     accountv1.AccountActionTone_ACCOUNT_ACTION_TONE_DEFAULT,
	}
	for _, option := range options {
		if option != nil {
			option(d)
		}
	}
	return d
}

func Tone(tone accountv1.AccountActionTone) Option {
	return func(d *accountv1.AccountActionDescriptor) {
		if tone != accountv1.AccountActionTone_ACCOUNT_ACTION_TONE_UNSPECIFIED {
			d.Tone = tone
		}
	}
}

func Disabled(reason string) Option {
	return func(d *accountv1.AccountActionDescriptor) {
		d.Disabled = true
		d.DisabledReason = strings.TrimSpace(reason)
	}
}

func Confirmation(required bool) Option {
	return func(d *accountv1.AccountActionDescriptor) {
		d.RequiresConfirmation = required
	}
}

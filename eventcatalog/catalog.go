package eventcatalog

const (
	StreamName      = "BYTE_V_FORGE_EVENTS"
	StreamSubject   = "byte.v.forge.>"
	DeadLetterTopic = "byte.v.forge.platform.dead_letter"
	EventVersionV1  = "v1"
)

type Kind string

const (
	KindFact    Kind = "fact"
	KindCommand Kind = "command"
)

type Definition struct {
	Subject          string
	EventName        string
	EventVersion     string
	Kind             Kind
	PayloadType      string
	OwnerService     string
	ConsumerDurable  string
	Retryable        bool
	MaxDeliveries    int
	RetryDelaySecond int
}

var (
	SMSOrderAcquired = Definition{
		Subject:      "byte.v.forge.sms.order.acquired",
		EventName:    "sms.order.acquired",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.sms.v1.SmsOrderAcquiredEvent",
		OwnerService: "sms-service",
	}
	SMSCodeReceived = Definition{
		Subject:      "byte.v.forge.sms.code.received",
		EventName:    "sms.code.received",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.sms.v1.SmsCodeReceivedEvent",
		OwnerService: "sms-service",
	}
	SMSOrderStatusChanged = Definition{
		Subject:      "byte.v.forge.sms.order.status_changed",
		EventName:    "sms.order.status_changed",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.sms.v1.SmsOrderStatusChangedEvent",
		OwnerService: "sms-service",
	}

	MailboxEmailPollRequested = Definition{
		Subject:          "byte.v.forge.mailbox.email.poll.requested",
		EventName:        "mailbox.email.poll_requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "byte.v.forge.contracts.mailbox.v1.MailboxEmailPollRequest",
		OwnerService:     "mailbox-api",
		ConsumerDurable:  "mailbox-email-poll",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
	}
	AccountChanged = Definition{
		Subject:      "byte.v.forge.account.changed",
		EventName:    "account.changed",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.account.v1.AccountChangedEvent",
		OwnerService: "platform",
	}

	WAOTPReceived = Definition{
		Subject:      "byte.v.forge.wa.otp.received",
		EventName:    "wa.otp.received",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.wa.v1.WaOtpReceivedEvent",
		OwnerService: "wa-app-service",
	}

	MailboxEmailReceived = Definition{
		Subject:      "byte.v.forge.mailbox.email.received",
		EventName:    "mailbox.email.received",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.mailbox.v1.MailboxEmailReceivedEvent",
		OwnerService: "mailbox-api",
	}
	DeadLetter = Definition{
		Subject:      DeadLetterTopic,
		EventName:    "platform.dead_letter",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.common.v1.DeadLetterEvent",
		OwnerService: "platform",
	}
)

func All() []Definition {
	return []Definition{
		SMSOrderAcquired,
		SMSCodeReceived,
		SMSOrderStatusChanged,
		MailboxEmailPollRequested,
		MailboxEmailReceived,
		AccountChanged,
		WAOTPReceived,
		DeadLetter,
	}
}

func Subjects() []string {
	return []string{StreamSubject}
}

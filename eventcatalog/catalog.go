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
	SMSOrderAcquireRequested = Definition{
		Subject:          "byte.v.forge.sms.order.acquire.requested",
		EventName:        "sms.order.acquire_requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "byte.v.forge.sms.internal.v1.SmsOrderAcquireRequest",
		OwnerService:     "sms-service",
		ConsumerDurable:  "sms-order-acquire",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
	}
	SMSOrderPollRequested = Definition{
		Subject:          "byte.v.forge.sms.order.poll.requested",
		EventName:        "sms.order.poll_requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "byte.v.forge.sms.internal.v1.SmsOrderPollRequest",
		OwnerService:     "sms-service",
		ConsumerDurable:  "sms-order-poll",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
	}
	SMSOrderCancelRequested = Definition{
		Subject:          "byte.v.forge.sms.order.cancel.requested",
		EventName:        "sms.order.cancel_requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "byte.v.forge.sms.internal.v1.SmsOrderCancelRequest",
		OwnerService:     "sms-service",
		ConsumerDurable:  "sms-order-cancel",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
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
	MailboxInboxFetchRequested = Definition{
		Subject:          "byte.v.forge.mailbox.inbox.fetch.requested",
		EventName:        "mailbox.inbox.fetch_requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "mailbox.MailboxInboxFetchRequest",
		OwnerService:     "mailbox-api",
		ConsumerDurable:  "mailbox-inbox-fetch",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
	}
	MailboxRegistrationRequested = Definition{
		Subject:          "byte.v.forge.mailbox.registration.requested",
		EventName:        "mailbox.registration.requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "mailbox.MailboxRegistrationOperationRequest",
		OwnerService:     "mailbox-api",
		ConsumerDurable:  "mailbox-registration",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
	}
	MailboxOAuthRequested = Definition{
		Subject:          "byte.v.forge.mailbox.oauth.requested",
		EventName:        "mailbox.oauth.requested",
		EventVersion:     EventVersionV1,
		Kind:             KindCommand,
		PayloadType:      "mailbox.MailboxOAuthOperationRequest",
		OwnerService:     "mailbox-api",
		ConsumerDurable:  "mailbox-oauth",
		Retryable:        true,
		MaxDeliveries:    20,
		RetryDelaySecond: 5,
	}
	MailboxEmailReceived = Definition{
		Subject:      "byte.v.forge.mailbox.email.received",
		EventName:    "mailbox.email.received",
		EventVersion: EventVersionV1,
		Kind:         KindFact,
		PayloadType:  "byte.v.forge.contracts.mailbox.v1.MailboxEmailReceivedEvent",
		OwnerService: "mailbox-api",
	}
)

func All() []Definition {
	return []Definition{
		SMSOrderAcquired,
		SMSOrderAcquireRequested,
		SMSOrderPollRequested,
		SMSOrderCancelRequested,
		SMSCodeReceived,
		SMSOrderStatusChanged,
		MailboxEmailPollRequested,
		MailboxInboxFetchRequested,
		MailboxRegistrationRequested,
		MailboxOAuthRequested,
		MailboxEmailReceived,
		{Subject: DeadLetterTopic, EventName: "platform.dead_letter", EventVersion: EventVersionV1, Kind: KindFact, PayloadType: "byte.v.forge.contracts.common.v1.DeadLetterEvent", OwnerService: "platform"},
	}
}

func Subjects() []string {
	return []string{StreamSubject}
}

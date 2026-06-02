package eventbus

import (
	"errors"
	"fmt"
	"strings"

	"google.golang.org/protobuf/proto"
)

var (
	ErrEmptyEnvelope            = errors.New("event envelope is required")
	ErrEmptyProtoType           = errors.New("event proto type is required")
	ErrMismatchedSubject        = errors.New("event subject does not match expected event")
	ErrMismatchedEventName      = errors.New("event context event_name does not match expected event")
	ErrMismatchedEventVersion   = errors.New("event context event_version does not match expected event")
	ErrMismatchedEventProtoType = errors.New("event proto type does not match expected event")
)

type ExpectedMessage struct {
	Subject      string
	EventName    string
	EventVersion string
	ProtoType    string
}

func (expected ExpectedMessage) IsZero() bool {
	return strings.TrimSpace(expected.Subject) == "" &&
		strings.TrimSpace(expected.EventName) == "" &&
		strings.TrimSpace(expected.EventVersion) == "" &&
		strings.TrimSpace(expected.ProtoType) == ""
}

func (expected ExpectedMessage) ValidateReceived(received ReceivedMessage) error {
	if expected.IsZero() {
		return nil
	}
	if received.Envelope == nil {
		return ErrEmptyEnvelope
	}
	if err := expected.validateSubject(received); err != nil {
		return err
	}
	if err := expected.validateContext(received); err != nil {
		return err
	}
	if err := expected.validateProtoType(received.Envelope.GetProtoType()); err != nil {
		return err
	}
	return nil
}

func (expected ExpectedMessage) ValidateEvent(event proto.Message) error {
	protoType := strings.TrimSpace(expected.ProtoType)
	if protoType == "" {
		return nil
	}
	if event == nil {
		return ErrEmptyEvent
	}
	actualType := string(event.ProtoReflect().Descriptor().FullName())
	if actualType != protoType {
		return fmt.Errorf("%w: expected %s, got %s", ErrMismatchedEventProtoType, protoType, actualType)
	}
	return nil
}

func (expected ExpectedMessage) validateSubject(received ReceivedMessage) error {
	subject := strings.TrimSpace(expected.Subject)
	if subject == "" {
		return nil
	}
	receivedSubject := strings.TrimSpace(received.Subject)
	if receivedSubject != "" && receivedSubject != subject {
		return fmt.Errorf("%w: expected %s, got %s", ErrMismatchedSubject, subject, receivedSubject)
	}
	envelopeSubject := strings.TrimSpace(received.Envelope.GetSubject())
	if envelopeSubject == "" {
		return ErrEmptySubject
	}
	if envelopeSubject != subject {
		return fmt.Errorf("%w: expected %s, got %s", ErrMismatchedSubject, subject, envelopeSubject)
	}
	return nil
}

func (expected ExpectedMessage) validateContext(received ReceivedMessage) error {
	eventName := strings.TrimSpace(expected.EventName)
	eventVersion := strings.TrimSpace(expected.EventVersion)
	if eventName == "" && eventVersion == "" {
		return nil
	}
	eventCtx := received.Envelope.GetContext()
	if err := ValidateContext(eventCtx); err != nil {
		return err
	}
	if eventName != "" && strings.TrimSpace(eventCtx.GetEventName()) != eventName {
		return fmt.Errorf("%w: expected %s, got %s", ErrMismatchedEventName, eventName, eventCtx.GetEventName())
	}
	if eventVersion != "" && strings.TrimSpace(eventCtx.GetEventVersion()) != eventVersion {
		return fmt.Errorf("%w: expected %s, got %s", ErrMismatchedEventVersion, eventVersion, eventCtx.GetEventVersion())
	}
	return nil
}

func (expected ExpectedMessage) validateProtoType(actual string) error {
	protoType := strings.TrimSpace(expected.ProtoType)
	if protoType == "" {
		return nil
	}
	actual = strings.TrimSpace(actual)
	if actual == "" {
		return ErrEmptyProtoType
	}
	if actual != protoType {
		return fmt.Errorf("%w: expected %s, got %s", ErrMismatchedEventProtoType, protoType, actual)
	}
	return nil
}

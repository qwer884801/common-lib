package accountaction

import (
	"strings"

	accountv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/account/v1"
)

type DefinitionOption func(*accountv1.AccountActionDefinition)

type ButtonOption func(*accountv1.AccountActionButton)

func Definition(actionID string, displayName string, options ...DefinitionOption) *accountv1.AccountActionDefinition {
	def := &accountv1.AccountActionDefinition{
		ActionId:    strings.TrimSpace(actionID),
		DisplayName: strings.TrimSpace(displayName),
	}
	for _, option := range options {
		if option != nil {
			option(def)
		}
	}
	applyDefinitionDefaults(def)
	return def
}

func Owner(owner string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.Owner = strings.TrimSpace(owner)
	}
}

func Visibility(visibility string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.Visibility = strings.TrimSpace(visibility)
	}
}

func RequestProto(name string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.RequestProto = strings.TrimSpace(name)
	}
}

func ResponseProto(name string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.ResponseProto = strings.TrimSpace(name)
	}
}

func RequiredStatuses(statuses ...string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.RequiredAccountStatuses = appendTrimmed(def.RequiredAccountStatuses, statuses...)
	}
}

func BlockedStatuses(statuses ...string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.BlockedAccountStatuses = appendTrimmed(def.BlockedAccountStatuses, statuses...)
	}
}

func RequiredFields(fields ...string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.RequiredFields = appendTrimmed(def.RequiredFields, fields...)
	}
}

func Capabilities(capabilities ...string) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.Capabilities = appendTrimmed(def.Capabilities, capabilities...)
	}
}

func N8NWorkflow(key string, idPrefix string, startPath string, actionScope string, webhookPath string, actionPathPrefix string, apiKind accountv1.AccountActionAPIKind) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		def.Engine = accountv1.AccountActionEngine_ACCOUNT_ACTION_ENGINE_N8N
		def.Workflow = &accountv1.AccountActionWorkflowDefinition{
			Key:              strings.TrimSpace(key),
			IdPrefix:         strings.TrimSpace(idPrefix),
			StartPath:        normalizePath(startPath),
			N8NActionScope:   strings.TrimSpace(actionScope),
			N8NWebhookPath:   strings.TrimSpace(webhookPath),
			ActionPathPrefix: normalizePath(actionPathPrefix),
			ActionApiKind:    apiKind,
		}
	}
}

func DefaultButton(label string, placement string, options ...ButtonOption) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		button := &accountv1.AccountActionButton{
			Id:        buttonID(def.GetActionId()),
			Label:     strings.TrimSpace(label),
			Placement: strings.TrimSpace(placement),
			StartPath: workflowStartPath(def),
		}
		for _, option := range options {
			if option != nil {
				option(button)
			}
		}
		def.UiButtons = append(def.UiButtons, button)
	}
}

func Button(id string, label string, placement string, options ...ButtonOption) DefinitionOption {
	return func(def *accountv1.AccountActionDefinition) {
		button := &accountv1.AccountActionButton{
			Id:        strings.TrimSpace(id),
			Label:     strings.TrimSpace(label),
			Placement: strings.TrimSpace(placement),
			StartPath: workflowStartPath(def),
		}
		for _, option := range options {
			if option != nil {
				option(button)
			}
		}
		def.UiButtons = append(def.UiButtons, button)
	}
}

func ButtonIntent(intent string) ButtonOption {
	return func(button *accountv1.AccountActionButton) {
		button.Intent = strings.TrimSpace(intent)
	}
}

func ButtonStartPath(path string) ButtonOption {
	return func(button *accountv1.AccountActionButton) {
		button.StartPath = normalizePath(path)
	}
}

func Catalog(definitions ...*accountv1.AccountActionDefinition) *accountv1.AccountActionCatalog {
	out := &accountv1.AccountActionCatalog{Actions: make([]*accountv1.AccountActionDefinition, 0, len(definitions))}
	for _, definition := range definitions {
		if definition != nil {
			out.Actions = append(out.Actions, definition)
		}
	}
	return out
}

func appendTrimmed(out []string, values ...string) []string {
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			out = append(out, value)
		}
	}
	return out
}

func workflowStartPath(def *accountv1.AccountActionDefinition) string {
	if def.GetWorkflow() == nil {
		return ""
	}
	return def.GetWorkflow().GetStartPath()
}

func applyDefinitionDefaults(def *accountv1.AccountActionDefinition) {
	startPath := workflowStartPath(def)
	for _, button := range def.GetUiButtons() {
		if button.GetStartPath() == "" {
			button.StartPath = startPath
		}
	}
}

func buttonID(actionID string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(actionID), "_", "-"))
}

func normalizePath(path string) string {
	path = strings.TrimSpace(path)
	if path == "" || strings.HasPrefix(path, "/") {
		return path
	}
	return "/" + path
}

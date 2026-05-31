package accountmodel

import (
	"fmt"
	"regexp"
	"strings"
)

var accountIDPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$`)

func NormalizeAccountID(value string) (string, error) {
	return NormalizeAccountIDField(value, "account_id")
}

func NormalizeAccountIDField(value string, field string) (string, error) {
	field = strings.TrimSpace(field)
	if field == "" {
		field = "account_id"
	}
	value = strings.TrimSpace(value)
	if value == "" {
		return "", fmt.Errorf("%s is required", field)
	}
	if !accountIDPattern.MatchString(value) {
		return "", fmt.Errorf("%s must use letters, digits, colon, underscore or dash", field)
	}
	return value, nil
}

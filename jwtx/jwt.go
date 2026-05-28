package jwtx

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/byte-v-forge/common-lib/jsonx"
)

func Payload(token string) (map[string]any, error) {
	token = strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(token), "Bearer "))
	parts := strings.Split(token, ".")
	if len(parts) < 2 {
		return nil, fmt.Errorf("jwt payload is missing")
	}
	raw, err := decodeSegment(parts[1])
	if err != nil {
		return nil, err
	}
	var claims map[string]any
	if err := json.Unmarshal(raw, &claims); err != nil {
		return nil, err
	}
	return claims, nil
}

func PayloadOrNil(token string) map[string]any {
	claims, err := Payload(token)
	if err != nil {
		return nil
	}
	return claims
}

func ExpiresAt(token string) int64 {
	claims := PayloadOrNil(token)
	if claims == nil {
		return 0
	}
	return jsonx.Int(claims["exp"])
}

func decodeSegment(segment string) ([]byte, error) {
	if raw, err := base64.RawURLEncoding.DecodeString(segment); err == nil {
		return raw, nil
	}
	padded := segment + strings.Repeat("=", (4-len(segment)%4)%4)
	return base64.URLEncoding.DecodeString(padded)
}

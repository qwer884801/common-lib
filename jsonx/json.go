package jsonx

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
)

type Map map[string]any

func Compact(value any) ([]byte, error) {
	if value == nil {
		return nil, nil
	}
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(value); err != nil {
		return nil, err
	}
	return bytes.TrimSpace(buf.Bytes()), nil
}

func DecodeMap(raw []byte) (Map, error) {
	if len(bytes.TrimSpace(raw)) == 0 {
		return Map{}, nil
	}
	var payload any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	if obj, ok := Object(payload); ok {
		return Map(obj), nil
	}
	return Map{"value": payload}, nil
}

func DataObject(payload Map) Map {
	if payload == nil {
		return Map{}
	}
	if data, ok := Object(payload["data"]); ok && data != nil {
		return Map(data)
	}
	return payload
}

func Object(value any) (map[string]any, bool) {
	switch typed := value.(type) {
	case map[string]any:
		return typed, typed != nil
	case Map:
		return map[string]any(typed), typed != nil
	default:
		return nil, false
	}
}

func StringAt(value any, path ...string) string {
	return String(Path(value, path...))
}

func BoolAt(value any, path ...string) bool {
	return Bool(Path(value, path...))
}

func IntAt(value any, path ...string) int64 {
	return Int(Path(value, path...))
}

func Path(value any, path ...string) any {
	current := value
	for _, key := range path {
		obj, ok := Object(current)
		if !ok {
			return nil
		}
		current = obj[key]
	}
	return current
}

func String(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case fmt.Stringer:
		return typed.String()
	case nil:
		return ""
	default:
		return fmt.Sprint(typed)
	}
}

func Bool(value any) bool {
	switch typed := value.(type) {
	case bool:
		return typed
	case string:
		return strings.EqualFold(strings.TrimSpace(typed), "true")
	default:
		return false
	}
}

func Int(value any) int64 {
	switch typed := value.(type) {
	case int:
		return int64(typed)
	case int8:
		return int64(typed)
	case int16:
		return int64(typed)
	case int32:
		return int64(typed)
	case int64:
		return typed
	case uint:
		return int64(typed)
	case uint8:
		return int64(typed)
	case uint16:
		return int64(typed)
	case uint32:
		return int64(typed)
	case uint64:
		return int64(typed)
	case float32:
		return int64(typed)
	case float64:
		return int64(typed)
	case json.Number:
		if parsed, err := typed.Int64(); err == nil {
			return parsed
		}
		if parsed, err := strconv.ParseFloat(string(typed), 64); err == nil {
			return int64(parsed)
		}
	case string:
		if strings.TrimSpace(typed) == "" {
			return 0
		}
		if parsed, err := strconv.ParseFloat(strings.TrimSpace(typed), 64); err == nil {
			return int64(parsed)
		}
	}
	return 0
}

func NormalizeKey(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, "_", "")
	value = strings.ReplaceAll(value, "-", "")
	return value
}

func StringAtAnyKey(value any, keys ...string) string {
	wanted := make(map[string]struct{}, len(keys))
	for _, key := range keys {
		if normalized := NormalizeKey(key); normalized != "" {
			wanted[normalized] = struct{}{}
		}
	}
	var walk func(any) string
	walk = func(current any) string {
		if obj, ok := Object(current); ok {
			for key, item := range obj {
				if _, ok := wanted[NormalizeKey(key)]; ok {
					if text := strings.TrimSpace(String(item)); text != "" && text != "<nil>" {
						return text
					}
				}
			}
			for _, item := range obj {
				if text := walk(item); text != "" {
					return text
				}
			}
		}
		if items, ok := current.([]any); ok {
			for _, item := range items {
				if text := walk(item); text != "" {
					return text
				}
			}
		}
		return ""
	}
	return walk(value)
}

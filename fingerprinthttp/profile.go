package fingerprinthttp

import (
	"net/http"
	"strings"

	"github.com/byte-v-forge/common-lib/browserfingerprint"
)

type Profile struct {
	ProxyURL       string
	TLSProfileName string
	UserAgent      string
	SecCHUA        string
	SecCHPlatform  string
	AcceptLanguage string
	Language       string
	DeviceID       string
}

func (p Profile) WithDefaults(fallback Profile) Profile {
	p.ProxyURL = firstNonEmpty(p.ProxyURL, fallback.ProxyURL)
	p.TLSProfileName = browserfingerprint.ResolveTLSProfileName(firstNonEmpty(p.TLSProfileName, fallback.TLSProfileName), browserfingerprint.DefaultTLSProfileName)
	p.UserAgent = firstNonEmpty(p.UserAgent, fallback.UserAgent)
	p.SecCHUA = firstNonEmpty(p.SecCHUA, fallback.SecCHUA)
	p.SecCHPlatform = firstNonEmpty(p.SecCHPlatform, fallback.SecCHPlatform)
	p.AcceptLanguage = firstNonEmpty(p.AcceptLanguage, fallback.AcceptLanguage)
	p.Language = firstNonEmpty(p.Language, fallback.Language)
	p.DeviceID = firstNonEmpty(p.DeviceID, fallback.DeviceID)
	return p
}

func (p Profile) ApplyBrowserHeaders(headers http.Header) {
	if headers == nil {
		return
	}
	if value := strings.TrimSpace(p.UserAgent); value != "" {
		headers.Set("User-Agent", value)
	}
	if value := strings.TrimSpace(p.AcceptLanguage); value != "" {
		headers.Set("Accept-Language", value)
	}
	if value := strings.TrimSpace(p.SecCHUA); value != "" {
		headers.Set("sec-ch-ua", value)
		headers.Set("sec-ch-ua-mobile", "?0")
	}
	if value := strings.TrimSpace(p.SecCHPlatform); value != "" {
		headers.Set("sec-ch-ua-platform", value)
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value = strings.TrimSpace(value); value != "" {
			return value
		}
	}
	return ""
}

package browserfingerprint

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/bogdanfinn/tls-client/profiles"
)

const DefaultTLSProfileName = "chrome_146"

type Fingerprint struct {
	DeviceID       string
	TLSProfileName string
	TLSProfile     profiles.ClientProfile
	UserAgent      string
	SecCHUA        string
	SecCHPlatform  string
	AcceptLanguage string
	Language       string
}

type ChromiumCandidate struct {
	ProfileName  string
	MajorVersion string
	OSToken      string
	Platform     string
}

func DefaultChromiumCandidates() []ChromiumCandidate {
	return []ChromiumCandidate{
		{ProfileName: "chrome_146", MajorVersion: "146", OSToken: "Windows NT 10.0; Win64; x64", Platform: "Windows"},
		{ProfileName: "chrome_146", MajorVersion: "146", OSToken: "Macintosh; Intel Mac OS X 14_6_1", Platform: "macOS"},
		{ProfileName: "chrome_146_PSK", MajorVersion: "146", OSToken: "Windows NT 10.0; Win64; x64", Platform: "Windows"},
		{ProfileName: "chrome_146_PSK", MajorVersion: "146", OSToken: "Macintosh; Intel Mac OS X 14_6_1", Platform: "macOS"},
		{ProfileName: "chrome_144", MajorVersion: "144", OSToken: "Windows NT 10.0; Win64; x64", Platform: "Windows"},
		{ProfileName: "chrome_144", MajorVersion: "144", OSToken: "Macintosh; Intel Mac OS X 14_5", Platform: "macOS"},
		{ProfileName: "chrome_144_PSK", MajorVersion: "144", OSToken: "Windows NT 10.0; Win64; x64", Platform: "Windows"},
		{ProfileName: "chrome_144_PSK", MajorVersion: "144", OSToken: "Macintosh; Intel Mac OS X 14_5", Platform: "macOS"},
		{ProfileName: "chrome_133", MajorVersion: "133", OSToken: "Windows NT 10.0; Win64; x64", Platform: "Windows"},
		{ProfileName: "chrome_133", MajorVersion: "133", OSToken: "Macintosh; Intel Mac OS X 13_7_2", Platform: "macOS"},
		{ProfileName: "chrome_131", MajorVersion: "131", OSToken: "Windows NT 10.0; Win64; x64", Platform: "Windows"},
		{ProfileName: "chrome_131", MajorVersion: "131", OSToken: "Macintosh; Intel Mac OS X 13_6_7", Platform: "macOS"},
	}
}

func BuildChromium(candidate ChromiumCandidate, locale string, deviceID string) Fingerprint {
	if candidate.ProfileName == "" {
		candidate = DefaultChromiumCandidates()[0]
	}
	profileName := ResolveTLSProfileName(candidate.ProfileName, DefaultTLSProfileName)
	profile, ok := TLSProfile(profileName)
	if !ok {
		profileName = DefaultTLSProfileName
		profile, _ = TLSProfile(profileName)
	}
	if candidate.MajorVersion == "" {
		candidate.MajorVersion = chromeMajorVersion(profileName)
	}
	if candidate.OSToken == "" {
		candidate.OSToken = "Windows NT 10.0; Win64; x64"
	}
	if candidate.Platform == "" {
		candidate.Platform = "Windows"
	}
	acceptLanguage, language := Languages(locale)
	return Fingerprint{
		DeviceID:       strings.TrimSpace(deviceID),
		TLSProfileName: profileName,
		TLSProfile:     profile,
		UserAgent:      fmt.Sprintf("Mozilla/5.0 (%s) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s.0.0.0 Safari/537.36", candidate.OSToken, candidate.MajorVersion),
		SecCHUA:        fmt.Sprintf(`"Google Chrome";v="%s", "Not.A/Brand";v="8", "Chromium";v="%s"`, candidate.MajorVersion, candidate.MajorVersion),
		SecCHPlatform:  fmt.Sprintf(`"%s"`, candidate.Platform),
		AcceptLanguage: acceptLanguage,
		Language:       language,
	}
}

func SelectChromiumCandidate(candidates []ChromiumCandidate, selector string) (ChromiumCandidate, bool) {
	if len(candidates) == 0 {
		return ChromiumCandidate{}, false
	}
	selector = NormalizeSelector(selector)
	if selector == "" || selector == "stable" || selector == "default" {
		return candidates[0], true
	}
	for _, candidate := range candidates {
		if CandidateMatches(candidate, selector) {
			return candidate, true
		}
	}
	if profileName := CanonicalTLSProfileName(selector); profileName != "" {
		for _, candidate := range candidates {
			if strings.EqualFold(candidate.ProfileName, profileName) {
				return candidate, true
			}
		}
	}
	return candidates[0], false
}

func CandidateMatches(candidate ChromiumCandidate, normalizedSelector string) bool {
	platform := NormalizeSelector(candidate.Platform)
	profile := NormalizeSelector(candidate.ProfileName)
	major := NormalizeSelector(candidate.MajorVersion)
	osAlias := OSAlias(candidate)
	for _, label := range []string{profile, platform, osAlias, major, profile + "_" + platform, profile + "_" + osAlias, "chrome_" + major + "_" + platform, "chrome_" + major + "_" + osAlias} {
		if label != "" && normalizedSelector == label {
			return true
		}
	}
	return false
}

func OSAlias(candidate ChromiumCandidate) string {
	platform := strings.ToLower(candidate.Platform)
	token := strings.ToLower(candidate.OSToken)
	switch {
	case strings.Contains(platform, "win") || strings.Contains(token, "windows"):
		return "windows"
	case strings.Contains(platform, "mac") || strings.Contains(token, "macintosh"):
		return "mac"
	default:
		return NormalizeSelector(candidate.Platform)
	}
}

func NormalizeSelector(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return ""
	}
	replacer := strings.NewReplacer(" ", "_", "-", "_", ":", "_", "/", "_", ".", "_", "\"", "", "'", "")
	value = replacer.Replace(value)
	value = strings.Trim(value, "_")
	for strings.Contains(value, "__") {
		value = strings.ReplaceAll(value, "__", "_")
	}
	return value
}

func Languages(locale string) (acceptLanguage string, language string) {
	normalized := strings.ToLower(strings.TrimSpace(locale))
	switch normalized {
	case "zh", "zh-cn", "zh_cn":
		return "zh-CN,zh;q=0.9,en;q=0.8", "zh-CN"
	case "id", "id-id", "id_id":
		return "id-ID,id;q=0.9,en;q=0.8", "id-ID"
	case "en-id", "en_id":
		return "en-ID,en;q=0.9", "en-ID"
	default:
		if strings.HasPrefix(normalized, "zh") {
			return "zh-CN,zh;q=0.9,en;q=0.8", "zh-CN"
		}
		return "en-US,en;q=0.9", "en-US"
	}
}

func ResolveTLSProfileName(name string, fallback string) string {
	name = strings.TrimSpace(name)
	if name != "" && !strings.EqualFold(name, "random") {
		if canonical := CanonicalTLSProfileName(name); canonical != "" {
			return canonical
		}
	}
	if canonical := CanonicalTLSProfileName(fallback); canonical != "" {
		return canonical
	}
	return DefaultTLSProfileName
}

func CanonicalTLSProfileName(name string) string {
	for candidate := range profiles.MappedTLSClients {
		if strings.EqualFold(candidate, name) {
			return candidate
		}
	}
	return ""
}

func CanonicalTLSProfileNames(names []string) []string {
	out := make([]string, 0, len(names))
	seen := map[string]bool{}
	for _, name := range names {
		canonical := CanonicalTLSProfileName(name)
		if canonical == "" || seen[canonical] {
			continue
		}
		seen[canonical] = true
		out = append(out, canonical)
	}
	return out
}

func TLSProfile(name string) (profiles.ClientProfile, bool) {
	canonical := CanonicalTLSProfileName(name)
	if canonical == "" {
		return profiles.ClientProfile{}, false
	}
	return profiles.MappedTLSClients[canonical], true
}

func RandomTLSProfileName(names []string) string {
	canonical := CanonicalTLSProfileNames(names)
	if len(canonical) == 0 {
		return DefaultTLSProfileName
	}
	return canonical[RandomIndex(len(canonical))]
}

func RandomIndex(size int) int {
	if size <= 1 {
		return 0
	}
	n, err := rand.Int(rand.Reader, big.NewInt(int64(size)))
	if err != nil {
		return int(time.Now().UnixNano() % int64(size))
	}
	return int(n.Int64())
}

func (f Fingerprint) ApplyBrowserHeaders(headers http.Header) {
	if headers == nil {
		return
	}
	if f.UserAgent != "" {
		headers.Set("User-Agent", f.UserAgent)
	}
	if f.AcceptLanguage != "" {
		headers.Set("Accept-Language", f.AcceptLanguage)
	}
	if f.SecCHUA != "" {
		headers.Set("sec-ch-ua", f.SecCHUA)
		headers.Set("sec-ch-ua-mobile", "?0")
	}
	if f.SecCHPlatform != "" {
		headers.Set("sec-ch-ua-platform", f.SecCHPlatform)
	}
}

func chromeMajorVersion(profileName string) string {
	parts := strings.Split(profileName, "_")
	if len(parts) >= 2 && parts[0] == "chrome" {
		return parts[1]
	}
	return "146"
}

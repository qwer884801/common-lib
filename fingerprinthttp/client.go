package fingerprinthttp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	fhttp "github.com/bogdanfinn/fhttp"
	"github.com/byte-v-forge/common-lib/browserhttp"
	"github.com/byte-v-forge/common-lib/httpclient"
	"github.com/byte-v-forge/common-lib/httpx"
	"github.com/byte-v-forge/common-lib/jsonx"
	"github.com/byte-v-forge/common-lib/redactx"
)

type Config struct {
	Timeout                 time.Duration
	ProxyURL                string
	Profile                 Profile
	DisableHTTP3            bool
	ForceHTTP1              bool
	RandomTLSExtensionOrder bool
	NotFollowRedirects      bool
	RetryMax                int
	RetryDelay              time.Duration
	MaxBodyBytes            int64
	BaseHeaders             http.Header
}

type Client struct {
	client    browserhttp.TLSClient
	cookieJar browserhttp.CookieJar
	config    Config
	headers   http.Header
	profile   Profile
}

type RequestOptions struct {
	Headers    http.Header
	JSONBody   any
	FormBody   url.Values
	Body       []byte
	Query      url.Values
	NoRedirect bool
}

type Response struct {
	StatusCode int
	Headers    http.Header
	Body       []byte
	JSON       map[string]any
}

func New(config Config) (*Client, error) {
	config = normalizeConfig(config)
	cookieJar := browserhttp.NewCookieJar()
	client, err := newTLSClient(config, cookieJar)
	if err != nil {
		return nil, err
	}
	headers := cloneHeader(config.BaseHeaders)
	config.Profile.ApplyBrowserHeaders(headers)
	return &Client{client: client, cookieJar: cookieJar, config: config, headers: headers, profile: config.Profile}, nil
}

func (c *Client) Request(ctx context.Context, method, rawURL string, opts RequestOptions) (*Response, error) {
	if c == nil || c.client == nil {
		return nil, fmt.Errorf("fingerprint http client is nil")
	}
	body, headers, err := c.requestBodyAndHeaders(opts)
	if err != nil {
		return nil, err
	}
	target, err := requestURL(rawURL, opts.Query)
	if err != nil {
		return nil, err
	}
	client := c.client
	if opts.NoRedirect {
		client.SetFollowRedirect(false)
		defer client.SetFollowRedirect(!c.config.NotFollowRedirects)
	}
	var lastErr error
	for attempt := 1; attempt <= c.config.RetryMax; attempt++ {
		var reader io.Reader
		if body != nil {
			reader = bytes.NewReader(body)
		}
		req, err := fhttp.NewRequestWithContext(ctx, strings.ToUpper(method), target, reader)
		if err != nil {
			return nil, err
		}
		req.Header = browserhttp.ToFHTTPHeader(headers)
		resp, err := client.Do(req)
		if err == nil {
			return c.readResponse(resp)
		}
		lastErr = err
		if attempt >= c.config.RetryMax || !httpclient.IsRetryableTransportError(err) {
			break
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(time.Duration(attempt) * c.config.RetryDelay):
		}
	}
	return nil, lastErr
}

func (c *Client) SetProxy(proxyURL string) error {
	if c == nil {
		return fmt.Errorf("fingerprint http client is nil")
	}
	proxyURL = strings.TrimSpace(proxyURL)
	if c.config.ProxyURL == proxyURL {
		return nil
	}
	c.config.ProxyURL = proxyURL
	c.profile.ProxyURL = proxyURL
	client, err := newTLSClient(c.config, c.cookieJar)
	if err != nil {
		return err
	}
	if c.client != nil {
		c.client.CloseIdleConnections()
	}
	c.client = client
	return nil
}

func (c *Client) Close() {
	if c != nil && c.client != nil {
		c.client.CloseIdleConnections()
	}
}

func (c *Client) CookieHeader(rawURL string) string {
	if c == nil || c.cookieJar == nil {
		return ""
	}
	target, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	cookies := c.cookieJar.Cookies(target)
	parts := make([]string, 0, len(cookies))
	seen := map[string]bool{}
	for _, cookie := range cookies {
		if cookie == nil || strings.TrimSpace(cookie.Name) == "" || cookie.Value == "" || seen[cookie.Name] {
			continue
		}
		seen[cookie.Name] = true
		parts = append(parts, cookie.Name+"="+cookie.Value)
	}
	return strings.Join(parts, "; ")
}

func (c *Client) Header() http.Header {
	if c == nil {
		return nil
	}
	return c.headers
}

func (c *Client) Profile() Profile {
	if c == nil {
		return Profile{}
	}
	return c.profile
}

func (c *Client) CookieJar() browserhttp.CookieJar {
	if c == nil {
		return nil
	}
	return c.cookieJar
}

func (r *Response) Excerpt(limit int) string {
	if r == nil {
		return "<nil response>"
	}
	if limit <= 0 {
		limit = 600
	}
	text := strings.TrimSpace(string(r.Body))
	if text == "" {
		raw, _ := json.Marshal(r.JSON)
		text = string(raw)
	}
	return redactx.Snippet(redactx.Text(text), limit)
}

func (r *Response) Require(status int, label string) error {
	if r == nil {
		return fmt.Errorf("%s: empty response", label)
	}
	if r.StatusCode != status {
		return fmt.Errorf("%s %d: %s", label, r.StatusCode, r.Excerpt(500))
	}
	return nil
}

func (c *Client) requestBodyAndHeaders(opts RequestOptions) ([]byte, http.Header, error) {
	headers := cloneHeader(c.headers)
	c.profile.ApplyBrowserHeaders(headers)
	mergeHeader(headers, opts.Headers)
	if opts.JSONBody != nil {
		raw, err := jsonx.Compact(opts.JSONBody)
		if err != nil {
			return nil, nil, err
		}
		if headers.Get("Content-Type") == "" {
			headers.Set("Content-Type", "application/json")
		}
		return raw, headers, nil
	}
	if opts.FormBody != nil {
		headers.Set("Content-Type", "application/x-www-form-urlencoded")
		return []byte(opts.FormBody.Encode()), headers, nil
	}
	if opts.Body != nil {
		return opts.Body, headers, nil
	}
	return nil, headers, nil
}

func (c *Client) readResponse(resp *fhttp.Response) (*Response, error) {
	defer resp.Body.Close()
	limit := c.config.MaxBodyBytes
	if limit <= 0 {
		limit = httpx.DefaultMaxBodyBytes
	}
	raw, err := httpx.ReadLimited(resp.Body, limit)
	if err != nil {
		return nil, err
	}
	payload, _ := jsonx.DecodeMap(raw)
	return &Response{StatusCode: resp.StatusCode, Headers: browserhttp.FromFHTTPHeader(resp.Header), Body: raw, JSON: map[string]any(payload)}, nil
}

func newTLSClient(config Config, cookieJar browserhttp.CookieJar) (browserhttp.TLSClient, error) {
	return browserhttp.NewTLSClient(browserhttp.Config{
		Timeout:                 config.Timeout,
		ProxyURL:                config.ProxyURL,
		TLSProfileName:          config.Profile.TLSProfileName,
		DisableHTTP3:            config.DisableHTTP3,
		ForceHTTP1:              config.ForceHTTP1,
		RandomTLSExtensionOrder: config.RandomTLSExtensionOrder,
		NotFollowRedirects:      config.NotFollowRedirects,
	}, cookieJar)
}

func normalizeConfig(config Config) Config {
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Second
	}
	if config.RetryMax <= 0 {
		config.RetryMax = 3
	}
	if config.RetryDelay <= 0 {
		config.RetryDelay = time.Second
	}
	if config.MaxBodyBytes <= 0 {
		config.MaxBodyBytes = httpx.DefaultMaxBodyBytes
	}
	config.ProxyURL = firstNonEmpty(config.ProxyURL, config.Profile.ProxyURL)
	config.Profile.ProxyURL = config.ProxyURL
	config.Profile = config.Profile.WithDefaults(Profile{})
	return config
}

func requestURL(rawURL string, query url.Values) (string, error) {
	target, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}
	if len(query) > 0 {
		values := target.Query()
		for key, items := range query {
			for _, value := range items {
				values.Add(key, value)
			}
		}
		target.RawQuery = values.Encode()
	}
	return target.String(), nil
}

func cloneHeader(src http.Header) http.Header {
	dst := make(http.Header)
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
	return dst
}

func mergeHeader(dst http.Header, src http.Header) {
	for key, values := range src {
		dst.Del(key)
		for _, value := range values {
			dst.Add(key, value)
		}
	}
}

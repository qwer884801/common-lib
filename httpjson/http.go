package httpjson

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/byte-v-forge/common-lib/httpclient"
	"github.com/byte-v-forge/common-lib/httpx"
	"github.com/byte-v-forge/common-lib/jsonx"
	"github.com/byte-v-forge/common-lib/redactx"
)

type Logger func(context.Context, string, map[string]any)

type RetryPolicy struct {
	Attempts int
	Backoff  time.Duration
}

func (p RetryPolicy) normalized() RetryPolicy {
	if p.Attempts < 1 {
		p.Attempts = 1
	}
	if p.Backoff <= 0 {
		p.Backoff = time.Second
	}
	return p
}

type Doer interface {
	Do(*http.Request) (*http.Response, error)
}

type Client struct {
	baseURL         *url.URL
	httpClient      Doer
	defaultHeaders  http.Header
	retry           RetryPolicy
	logger          Logger
	bodyLimit       int64
	decodeGzip      bool
	redactor        func(string) string
	retryLogMessage string
}

type Option func(*Client) error

func NewClient(baseURL string, opts ...Option) (*Client, error) {
	client := &Client{
		httpClient:      &http.Client{Timeout: 30 * time.Second},
		defaultHeaders:  make(http.Header),
		retry:           RetryPolicy{Attempts: 1, Backoff: time.Second},
		bodyLimit:       httpx.DefaultMaxBodyBytes,
		decodeGzip:      true,
		redactor:        redactx.Text,
		retryLogMessage: "httpjson retry",
	}
	if strings.TrimSpace(baseURL) != "" {
		parsed, err := url.Parse(strings.TrimRight(baseURL, "/"))
		if err != nil {
			return nil, err
		}
		if parsed.Scheme == "" || parsed.Host == "" {
			return nil, &ConfigError{Field: "base_url", Msg: "must be an absolute URL"}
		}
		client.baseURL = parsed
	}
	for _, opt := range opts {
		if err := opt(client); err != nil {
			return nil, err
		}
	}
	client.retry = client.retry.normalized()
	return client, nil
}

func WithHTTPClient(httpClient *http.Client) Option {
	return WithHTTPDoer(httpClient)
}

func WithHTTPDoer(httpClient Doer) Option {
	return func(client *Client) error {
		if httpClient == nil {
			return &ConfigError{Field: "http_client", Msg: "is nil"}
		}
		client.httpClient = httpClient
		return nil
	}
}

func WithHeader(key, value string) Option {
	return func(client *Client) error {
		key = strings.TrimSpace(key)
		if key == "" {
			return &ConfigError{Field: "header", Msg: "key is empty"}
		}
		deleteHeader(client.defaultHeaders, key)
		client.defaultHeaders[key] = []string{value}
		return nil
	}
}

func WithRetry(policy RetryPolicy) Option {
	return func(client *Client) error {
		client.retry = policy.normalized()
		return nil
	}
}

func WithLogger(logger Logger) Option {
	return func(client *Client) error {
		client.logger = logger
		return nil
	}
}

func WithBodyLimit(limit int64) Option {
	return func(client *Client) error {
		if limit > 0 {
			client.bodyLimit = limit
		}
		return nil
	}
}

func WithRetryLogMessage(message string) Option {
	return func(client *Client) error {
		if message = strings.TrimSpace(message); message != "" {
			client.retryLogMessage = message
		}
		return nil
	}
}

func WithRedactor(redactor func(string) string) Option {
	return func(client *Client) error {
		if redactor != nil {
			client.redactor = redactor
		}
		return nil
	}
}

type Request struct {
	Method       string
	Path         string
	Query        url.Values
	Body         []byte
	Headers      http.Header
	Operation    string
	ExpectStatus []int
}

type Response struct {
	StatusCode int
	Header     http.Header
	Body       []byte
	Payload    jsonx.Map
}

func (r *Response) Data() jsonx.Map {
	return jsonx.DataObject(r.Payload)
}

func (c *Client) Do(ctx context.Context, request Request) (*Response, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	method := strings.ToUpper(strings.TrimSpace(request.Method))
	if method == "" {
		method = http.MethodGet
	}
	target, err := c.requestURL(request.Path, request.Query)
	if err != nil {
		return nil, err
	}
	expected := statusSet(request.ExpectStatus)
	policy := c.retry.normalized()
	var lastErr error
	for attempt := 1; attempt <= policy.Attempts; attempt++ {
		resp, err := c.doOnce(ctx, method, target, request)
		if err == nil {
			if len(expected) == 0 || expected[resp.StatusCode] {
				return resp, nil
			}
			return resp, &HTTPError{
				Operation:  request.Operation,
				Method:     method,
				URL:        target.String(),
				StatusCode: resp.StatusCode,
				Body:       redactx.Snippet(c.redact(string(resp.Body)), 600),
			}
		}
		lastErr = err
		if attempt >= policy.Attempts || !httpclient.IsRetryableTransportError(err) {
			break
		}
		if c.logger != nil {
			c.logger(ctx, c.retryLogMessage, map[string]any{
				"operation": request.Operation,
				"host":      target.Host,
				"attempt":   attempt,
				"error":     c.redact(err.Error()),
			})
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(policy.Backoff * time.Duration(attempt)):
		}
	}
	return nil, lastErr
}

func (c *Client) doOnce(ctx context.Context, method string, target *url.URL, request Request) (*Response, error) {
	var body io.Reader
	if len(request.Body) > 0 {
		body = bytes.NewReader(request.Body)
	}
	httpReq, err := http.NewRequestWithContext(ctx, method, target.String(), body)
	if err != nil {
		return nil, err
	}
	copyHeadersExact(httpReq.Header, c.defaultHeaders)
	copyHeadersExact(httpReq.Header, request.Headers)
	if host := takeHostHeader(httpReq.Header); host != "" {
		httpReq.Host = host
	}
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, readErr := c.readBody(resp.Body)
	if readErr != nil {
		return nil, readErr
	}
	payload, _ := jsonx.DecodeMap(raw)
	return &Response{StatusCode: resp.StatusCode, Header: resp.Header.Clone(), Body: raw, Payload: payload}, nil
}

func (c *Client) requestURL(path string, query url.Values) (*url.URL, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil, &ConfigError{Field: "path", Msg: "is empty"}
	}
	parsed, err := url.Parse(path)
	if err != nil {
		return nil, err
	}
	if parsed.IsAbs() {
		appendQuery(parsed, query)
		return parsed, nil
	}
	if c.baseURL == nil {
		return nil, &ConfigError{Field: "base_url", Msg: "is required for relative paths"}
	}
	out := *c.baseURL
	out.Path = strings.TrimRight(out.Path, "/") + "/" + strings.TrimLeft(path, "/")
	if len(query) > 0 {
		out.RawQuery = query.Encode()
	}
	return &out, nil
}

func (c *Client) readBody(body io.Reader) ([]byte, error) {
	if c.decodeGzip {
		return httpx.ReadMaybeGzipLimited(body, c.bodyLimit)
	}
	return httpx.ReadLimited(body, c.bodyLimit)
}

func (c *Client) redact(value string) string {
	if c.redactor == nil {
		return value
	}
	return c.redactor(value)
}

func appendQuery(target *url.URL, query url.Values) {
	if len(query) == 0 {
		return
	}
	values := target.Query()
	for key, items := range query {
		for _, item := range items {
			values.Add(key, item)
		}
	}
	target.RawQuery = values.Encode()
}

func copyHeadersExact(dst, src http.Header) {
	for key, values := range src {
		deleteHeader(dst, key)
		dst[key] = append([]string(nil), values...)
	}
}

func deleteHeader(headers http.Header, key string) {
	for existing := range headers {
		if strings.EqualFold(existing, key) {
			delete(headers, existing)
		}
	}
}

func takeHostHeader(headers http.Header) string {
	for key, values := range headers {
		if !strings.EqualFold(key, "Host") {
			continue
		}
		delete(headers, key)
		for _, value := range values {
			if value = strings.TrimSpace(value); value != "" {
				return value
			}
		}
		return ""
	}
	return ""
}

func statusSet(values []int) map[int]bool {
	out := make(map[int]bool, len(values))
	for _, value := range values {
		out[value] = true
	}
	return out
}

type HTTPError struct {
	Operation  string
	Method     string
	URL        string
	StatusCode int
	Body       string
}

func (e *HTTPError) Error() string {
	op := e.Operation
	if op == "" {
		op = e.Method
	}
	if e.StatusCode == 0 {
		return fmt.Sprintf("%s %s failed: %s", op, e.URL, e.Body)
	}
	if e.Body == "" {
		return fmt.Sprintf("%s %s failed: status=%d", op, e.URL, e.StatusCode)
	}
	return fmt.Sprintf("%s %s failed: status=%d body=%s", op, e.URL, e.StatusCode, e.Body)
}

type ConfigError struct {
	Field string
	Msg   string
}

func (e *ConfigError) Error() string {
	if e.Field == "" {
		return e.Msg
	}
	return e.Field + ": " + e.Msg
}

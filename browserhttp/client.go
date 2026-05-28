package browserhttp

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	fhttp "github.com/bogdanfinn/fhttp"
	tlsclient "github.com/bogdanfinn/tls-client"
	"github.com/byte-v-forge/common-lib/browserfingerprint"
)

type TLSClient = tlsclient.HttpClient
type CookieJar = tlsclient.CookieJar

type HeaderOrderFunc func(headers http.Header, host string) (headerOrder []string, pseudoHeaderOrder []string)

type Config struct {
	Timeout                 time.Duration
	ProxyURL                string
	TLSProfileName          string
	RandomTLSExtensionOrder bool
	DisableHTTP3            bool
	ForceHTTP1              bool
	HeaderOrder             HeaderOrderFunc
}

type Client struct {
	client    tlsclient.HttpClient
	cookieJar CookieJar
	config    Config
}

func New(config Config) (*Client, error) {
	cookieJar := tlsclient.NewCookieJar()
	tlsClient, err := NewTLSClient(config, cookieJar)
	if err != nil {
		return nil, err
	}
	return &Client{client: tlsClient, cookieJar: cookieJar, config: normalizeConfig(config)}, nil
}

func NewCookieJar() CookieJar {
	return tlsclient.NewCookieJar()
}

func NewTLSClient(config Config, cookieJar CookieJar) (TLSClient, error) {
	config = normalizeConfig(config)
	if cookieJar == nil {
		cookieJar = tlsclient.NewCookieJar()
	}
	profile, ok := browserfingerprint.TLSProfile(config.TLSProfileName)
	if !ok {
		return nil, fmt.Errorf("unsupported TLS profile %q", config.TLSProfileName)
	}
	options := []tlsclient.HttpClientOption{
		tlsclient.WithTimeoutSeconds(int(config.Timeout.Seconds())),
		tlsclient.WithClientProfile(profile),
		tlsclient.WithCookieJar(cookieJar),
	}
	if config.RandomTLSExtensionOrder {
		options = append(options, tlsclient.WithRandomTLSExtensionOrder())
	}
	if config.DisableHTTP3 {
		options = append(options, tlsclient.WithDisableHttp3())
	}
	if config.ForceHTTP1 {
		options = append(options, tlsclient.WithForceHttp1())
	}
	if config.ProxyURL != "" {
		options = append(options, tlsclient.WithProxyUrl(config.ProxyURL))
	}
	return tlsclient.NewHttpClient(tlsclient.NewNoopLogger(), options...)
}

func (c *Client) Do(req *http.Request) (*http.Response, error) {
	var body []byte
	if req.Body != nil {
		var err error
		body, err = io.ReadAll(req.Body)
		_ = req.Body.Close()
		if err != nil {
			return nil, err
		}
	}
	next, err := fhttp.NewRequestWithContext(req.Context(), req.Method, req.URL.String(), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	next.Header = ToFHTTPHeader(req.Header)
	if req.Host != "" {
		next.Host = req.Host
	}
	if c.config.HeaderOrder != nil {
		headerOrder, pseudoHeaderOrder := c.config.HeaderOrder(req.Header, req.Host)
		if len(headerOrder) > 0 {
			next.Header[fhttp.HeaderOrderKey] = headerOrder
		}
		if len(pseudoHeaderOrder) > 0 {
			next.Header[fhttp.PHeaderOrderKey] = pseudoHeaderOrder
		}
	}
	resp, err := c.client.Do(next)
	if err != nil {
		return nil, err
	}
	status := resp.Status
	if strings.TrimSpace(status) == "" {
		status = fmt.Sprintf("%d %s", resp.StatusCode, http.StatusText(resp.StatusCode))
	}
	return &http.Response{
		Status:        status,
		StatusCode:    resp.StatusCode,
		Header:        FromFHTTPHeader(resp.Header),
		Body:          resp.Body,
		ContentLength: resp.ContentLength,
		Request:       req,
	}, nil
}

func (c *Client) CloseIdleConnections() {
	if c != nil && c.client != nil {
		c.client.CloseIdleConnections()
	}
}

func (c *Client) CookieJar() CookieJar {
	if c == nil {
		return nil
	}
	return c.cookieJar
}

func ToFHTTPHeader(src http.Header) fhttp.Header {
	dst := make(fhttp.Header)
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
	return dst
}

func FromFHTTPHeader(src fhttp.Header) http.Header {
	dst := make(http.Header)
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
	return dst
}

func normalizeConfig(config Config) Config {
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Second
	}
	config.ProxyURL = strings.TrimSpace(config.ProxyURL)
	config.TLSProfileName = browserfingerprint.ResolveTLSProfileName(config.TLSProfileName, browserfingerprint.DefaultTLSProfileName)
	return config
}

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

package server

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testIndexHTML = `<!DOCTYPE html>
<html>
<head>
<link rel="shortcut icon" href="/favicon.ico">
<link rel="stylesheet" href="/3rdpartystatic/codemirror/neo.css" />
<link rel="stylesheet" href="//cdn.example.com/external.css" />
<script src="/static/js/main.js"></script>
</head>
<body>
<a href="/?nocookie">Go to the release selection screen</a>
<script>injectJs('/loader.js');</script>
</body>
</html>`

func testContent() *content {
	return &content{
		name:    "index.html",
		modTime: time.Now(),
		bs:      []byte(testIndexHTML),
	}
}

func prefixedTestContent(prefix string) *content {
	return &content{
		name:    "index.html",
		modTime: time.Now(),
		bs:      rewriteURLPrefix([]byte(testIndexHTML), prefix),
	}
}

func get(t *testing.T, mux *http.ServeMux, path string) (*http.Response, string) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	resp := w.Result()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("reading response body for %s: %v", path, err)
	}
	return resp, string(body)
}

// anyAssetPath returns the path of some embedded non-index asset, to verify
// static asset routing against the real bindata contents.
func anyAssetPath(t *testing.T) string {
	t.Helper()
	for _, name := range AssetNames() {
		if name != indexPath {
			return name
		}
	}
	t.Skip("no non-index assets embedded")
	return ""
}

func TestNormalizeURLPrefix(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"", ""},
		{"/", ""},
		{"//", ""},
		{"ratel", "/ratel"},
		{"/ratel", "/ratel"},
		{"/ratel/", "/ratel"},
		{"ratel/", "/ratel"},
		{" /ratel ", "/ratel"},
		{"/a/b/", "/a/b"},
	}
	for _, c := range cases {
		if got := normalizeURLPrefix(c.in); got != c.want {
			t.Errorf("normalizeURLPrefix(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestRewriteURLPrefix(t *testing.T) {
	out := string(rewriteURLPrefix([]byte(testIndexHTML), "/ratel"))

	for _, want := range []string{
		`href="/ratel/favicon.ico"`,
		`href="/ratel/3rdpartystatic/codemirror/neo.css"`,
		`src="/ratel/static/js/main.js"`,
		`href="/ratel/?nocookie"`,
		`injectJs('/ratel/loader.js')`,
		// Protocol-relative URLs must not be rewritten.
		`href="//cdn.example.com/external.css"`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("rewritten html missing %q\nhtml:\n%s", want, out)
		}
	}
}

func TestRewriteURLPrefixEmptyIsNoop(t *testing.T) {
	if out := string(rewriteURLPrefix([]byte(testIndexHTML), "")); out != testIndexHTML {
		t.Errorf("rewriteURLPrefix with empty prefix changed the payload")
	}
}

func TestNoPrefixServesIndexAtRoot(t *testing.T) {
	mux := newServeMux(testContent(), "")

	for _, path := range []string{"/", "/index.html"} {
		resp, body := get(t, mux, path)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("GET %s status = %d, want 200", path, resp.StatusCode)
		}
		if !strings.Contains(body, `href="/favicon.ico"`) {
			t.Errorf("GET %s: asset paths must stay unprefixed", path)
		}
	}
}

func TestNoPrefixServesStaticAsset(t *testing.T) {
	mux := newServeMux(testContent(), "")

	asset := anyAssetPath(t)
	resp, _ := get(t, mux, "/"+asset)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("GET /%s status = %d, want 200", asset, resp.StatusCode)
	}
}

func TestPrefixServesRewrittenIndex(t *testing.T) {
	mux := newServeMux(prefixedTestContent("/ratel"), "/ratel")

	for _, path := range []string{"/ratel/", "/ratel/index.html"} {
		resp, body := get(t, mux, path)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("GET %s status = %d, want 200", path, resp.StatusCode)
		}
		if !strings.Contains(body, `src="/ratel/static/js/main.js"`) {
			t.Errorf("GET %s: body missing prefixed asset path", path)
		}
		if strings.Contains(body, `href="/favicon.ico"`) {
			t.Errorf("GET %s: body still contains unprefixed asset path", path)
		}
	}
}

func TestPrefixBareRedirectsToSlash(t *testing.T) {
	mux := newServeMux(prefixedTestContent("/ratel"), "/ratel")

	resp, _ := get(t, mux, "/ratel")
	if resp.StatusCode != http.StatusMovedPermanently {
		t.Fatalf("GET /ratel status = %d, want %d",
			resp.StatusCode, http.StatusMovedPermanently)
	}
	if loc := resp.Header.Get("Location"); loc != "/ratel/" {
		t.Errorf("GET /ratel Location = %q, want %q", loc, "/ratel/")
	}
}

func TestPrefixRootReturns404(t *testing.T) {
	mux := newServeMux(prefixedTestContent("/ratel"), "/ratel")

	for _, path := range []string{"/", "/favicon.ico", "/ratelx"} {
		resp, body := get(t, mux, path)
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("GET %s status = %d, want 404", path, resp.StatusCode)
		}
		if path == "/" && !strings.Contains(body, "/ratel/") {
			t.Errorf("GET / body should hint at the prefix, got %q", body)
		}
	}
}

func TestPrefixServesStaticAsset(t *testing.T) {
	mux := newServeMux(prefixedTestContent("/ratel"), "/ratel")

	asset := anyAssetPath(t)
	resp, _ := get(t, mux, "/ratel/"+asset)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("GET /ratel/%s status = %d, want 200", asset, resp.StatusCode)
	}

	// The same asset must not resolve outside the prefix.
	resp, _ = get(t, mux, "/"+asset)
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("GET /%s status = %d, want 404", asset, resp.StatusCode)
	}
}

func TestResolveURLPrefix(t *testing.T) {
	cases := []struct {
		name         string
		flagValue    string
		flagSupplied bool
		envValue     string
		want         string
	}{
		{"neither set", "", false, "", ""},
		{"env only", "", false, "/from-env", "/from-env"},
		{"flag only", "/from-flag", true, "", "/from-flag"},
		{"flag wins over env", "/from-flag", true, "/from-env", "/from-flag"},
		// The reason resolveURLPrefix takes flagSupplied instead of checking
		// for an empty string: this is how an operator turns off a prefix that
		// the environment sets, and it must not fall back to the environment.
		{"explicit empty flag disables env", "", true, "/from-env", ""},
	}
	for _, c := range cases {
		got := resolveURLPrefix(c.flagValue, c.flagSupplied, c.envValue)
		if got != c.want {
			t.Errorf("%s: resolveURLPrefix(%q, %v, %q) = %q, want %q",
				c.name, c.flagValue, c.flagSupplied, c.envValue, got, c.want)
		}
	}
}

func TestValidateURLPrefix(t *testing.T) {
	for _, prefix := range []string{"", "/ratel", "/a/b", "/ratel-ui", "/Ratel_2"} {
		if err := validateURLPrefix(prefix); err != nil {
			t.Errorf("validateURLPrefix(%q) = %v, want nil", prefix, err)
		}
	}
	for _, prefix := range []string{
		"/my ratel", "/my\tratel", "/{$}", "/{name...}", "/{id}", "/ratel?x", "/ratel#y",
	} {
		if err := validateURLPrefix(prefix); err == nil {
			t.Errorf("validateURLPrefix(%q) = nil, want an error", prefix)
		}
	}
}

// validateURLPrefix only earns its place if the inputs it rejects really do
// break routing, so check the failure each one prevents. Without validation
// the first three panic inside mux.Handle and take the server down at startup,
// and the last two register cleanly but serve nothing.
func TestRejectedPrefixesBreakServeMux(t *testing.T) {
	cases := []struct{ prefix, probe string }{
		{"/my ratel", "/my ratel/index.html"},
		{"/{$}", "/{$}/index.html"},
		{"/{name...}", "/{name...}/index.html"},
		// A wildcard prefix registers, then matches any single segment while
		// http.StripPrefix still strips the literal "/{id}".
		{"/{id}", "/foo/index.html"},
		// "?" ends the path, so the rest becomes a query string.
		{"/ratel?x", "/ratel?x/index.html"},
	}
	for _, c := range cases {
		if err := validateURLPrefix(c.prefix); err == nil {
			t.Errorf("validateURLPrefix(%q) = nil, want an error", c.prefix)
			continue
		}
		if status, panicked := serveProbe(c.prefix, c.probe); !panicked && status == http.StatusOK {
			t.Errorf("prefix %q is rejected, but GET %q served 200 — "+
				"validateURLPrefix may be rejecting a usable prefix",
				c.prefix, c.probe)
		}
	}
}

// serveProbe reports what newServeMux does with a prefix: the status returned
// for probe, or panicked if route registration blew up.
func serveProbe(prefix, probe string) (status int, panicked bool) {
	defer func() {
		if recover() != nil {
			panicked = true
		}
	}()
	mux := newServeMux(prefixedTestContent(prefix), prefix)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, probe, nil))
	return w.Result().StatusCode, false
}

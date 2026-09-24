/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

package server

import (
	"bytes"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"unicode"
)

const (
	defaultPort = 8000
	defaultAddr = ""

	indexPath = "index.html"
)

var (
	port       int
	addr       string
	version    string
	commitINFO string
	commitID   string

	tlsCrt string
	tlsKey string

	listenAddr string

	urlPrefix string
)

// Run starts the server.
func Run() {
	parseFlags()
	indexContent := prepareIndexContent()

	mux := newServeMux(indexContent, urlPrefix)

	addrStr := fmt.Sprintf("%s:%d", listenAddr, port)
	if urlPrefix != "" {
		log.Printf("Serving under URL prefix %s/", urlPrefix)
	}
	log.Printf("Listening on %s...", addrStr)

	switch {
	case tlsCrt != "":
		log.Fatalln(http.ListenAndServeTLS(addrStr, tlsCrt, tlsKey, mux))
	default:
		log.Fatalln(http.ListenAndServe(addrStr, mux))
	}
}

// newServeMux builds the HTTP routing for the Ratel server. With an empty
// prefix all content is served from the root, preserving historic behavior.
// With a prefix (e.g. "/ratel") all content is served under that prefix, the
// bare prefix redirects to "<prefix>/", and any other path returns 404 with a
// hint pointing at the prefix.
func newServeMux(indexContent *content, prefix string) *http.ServeMux {
	mux := http.NewServeMux()
	mainHandler := makeMainHandler(indexContent)

	if prefix == "" {
		mux.Handle("/", mainHandler)
		return mux
	}

	mux.Handle(prefix+"/", http.StripPrefix(prefix, mainHandler))
	mux.Handle(prefix, http.RedirectHandler(prefix+"/", http.StatusMovedPermanently))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, fmt.Sprintf("Not found. Ratel is served under %s/", prefix),
			http.StatusNotFound)
	})
	return mux
}

func parseFlags() {
	portPtr := flag.Int("port", defaultPort, "Port on which the ratel server will run.")
	addrPtr := flag.String("addr", defaultAddr, "Address of the Dgraph server.")
	versionFlagPtr := flag.Bool("version", false, "Prints the version of ratel.")
	tlsCrtPtr := flag.String("tls_crt", "", "TLS cert for serving HTTPS requests.")
	tlsKeyPtr := flag.String("tls_key", "", "TLS key for serving HTTPS requests.")
	listenAddrPtr := flag.String("listen-addr", defaultAddr, "Address Ratel server should listen on.")
	urlPrefixPtr := flag.String("url-prefix", "",
		"URL path prefix under which Ratel is served, e.g. \"/ratel\" "+
			"(falls back to the RATEL_URL_PREFIX environment variable).")

	flag.Parse()

	if *versionFlagPtr {
		fmt.Printf("Ratel Version: %s\n", version)
		fmt.Printf("Commit ID: %s\n", commitID)
		fmt.Printf("Commit Info: %s\n", commitINFO)
		os.Exit(0)
	}

	var err error
	addr, err = validateAddr(*addrPtr)
	if err != nil && err != errAddrNil {
		fmt.Printf("Error parsing Dgraph server address: %s\n", err.Error())
		os.Exit(1)
	}

	port = *portPtr

	tlsCrt = *tlsCrtPtr
	tlsKey = *tlsKeyPtr

	listenAddr = *listenAddrPtr

	// flag cannot tell -url-prefix="" from an absent -url-prefix, so ask which
	// flags were actually set rather than comparing against the zero value.
	urlPrefixSupplied := false
	flag.Visit(func(f *flag.Flag) {
		if f.Name == "url-prefix" {
			urlPrefixSupplied = true
		}
	})
	prefix := resolveURLPrefix(*urlPrefixPtr, urlPrefixSupplied, os.Getenv("RATEL_URL_PREFIX"))

	urlPrefix = normalizeURLPrefix(prefix)
	// Fail here rather than in newServeMux: an invalid prefix makes mux.Handle
	// panic, and a panic during startup tells the operator nothing about which
	// setting caused it.
	if err := validateURLPrefix(urlPrefix); err != nil {
		fmt.Printf("Error parsing URL prefix %q: %s\n", prefix, err.Error())
		os.Exit(1)
	}
}

// resolveURLPrefix picks between the flag and the environment variable. A
// supplied flag always wins, so -url-prefix="" selects no prefix even when
// RATEL_URL_PREFIX is set; the environment is only consulted when the flag was
// left off entirely.
func resolveURLPrefix(flagValue string, flagSupplied bool, envValue string) string {
	if flagSupplied {
		return flagValue
	}
	return envValue
}

// normalizeURLPrefix ensures a prefix has a leading slash and no trailing
// slash. Empty input and "/" normalize to "" (no prefix).
func normalizeURLPrefix(prefix string) string {
	prefix = strings.TrimSpace(prefix)
	prefix = strings.TrimRight(prefix, "/")
	if prefix == "" {
		return ""
	}
	if !strings.HasPrefix(prefix, "/") {
		prefix = "/" + prefix
	}
	return prefix
}

// validateURLPrefix rejects prefixes that are not literal URL paths. Two of
// these crash the server at startup and the rest serve nothing, so the cost of
// a typo in -url-prefix or RATEL_URL_PREFIX is high enough to be worth naming
// the offending character:
//
//   - "{" and "}" are http.ServeMux wildcard syntax. "/{$}" and "/{name...}"
//     are only legal at the end of a pattern, so appending "/" in newServeMux
//     makes mux.Handle panic. A prefix like "/{id}" registers without
//     complaint, then matches "/anything" while http.StripPrefix still strips
//     the literal "/{id}", so every asset 404s.
//   - Whitespace separates the method from the path in a mux pattern, so
//     "/my ratel/" parses as the method "/my" and panics.
//   - "?" and "#" register fine but end the path in a browser, so an asset URL
//     built from the prefix never matches the route it was meant to reach.
func validateURLPrefix(prefix string) error {
	for _, r := range prefix {
		switch {
		case r == '{' || r == '}':
			return fmt.Errorf("contains %q, which http.ServeMux reads as wildcard syntax", r)
		case unicode.IsSpace(r):
			return fmt.Errorf("contains whitespace")
		case r == '?' || r == '#':
			return fmt.Errorf("contains %q, which ends the path in a URL", r)
		case !unicode.IsPrint(r):
			return fmt.Errorf("contains the non-printable character %q", r)
		}
	}
	return nil
}

func prepareIndexContent() *content {
	bs, err := Asset(indexPath)
	if err != nil {
		panic(fmt.Sprintf("Error retrieving \"%s\" asset", indexPath))
	}

	info, err := AssetInfo(indexPath)
	if err != nil {
		panic(fmt.Sprintf("Error retrieving \"%s\" asset info", indexPath))
	}

	tmpl, err := template.New(indexPath).Parse(string(bs))
	if err != nil {
		panic(fmt.Sprintf("Error parsing \"%s\" contents", indexPath))
	}

	data := struct {
		Addr string
	}{
		Addr: addr,
	}

	buf := bytes.NewBuffer([]byte{})
	err = tmpl.Execute(buf, data)
	if err != nil {
		log.Fatalln(err)
		panic(fmt.Sprintf("Error executing \"%s\" template", indexPath))
	}

	return &content{
		name:    info.Name(),
		modTime: info.ModTime(),
		bs:      rewriteURLPrefix(buf.Bytes(), urlPrefix),
	}
}

// hrefSrcRe matches root-relative URLs in href/src attributes, e.g.
// href="/favicon.ico" or src="/static/js/main.js". It deliberately does not
// match protocol-relative URLs such as href="//cdn.example.com/x.js".
var hrefSrcRe = regexp.MustCompile(`\b(href|src)="(/(?:[^/"][^"]*)?)"`)

// rewriteURLPrefix rewrites root-relative asset URLs in the index.html
// payload so they resolve when Ratel is served under a URL prefix.
func rewriteURLPrefix(bs []byte, prefix string) []byte {
	if prefix == "" {
		return bs
	}

	out := hrefSrcRe.ReplaceAllFunc(bs, func(m []byte) []byte {
		sub := hrefSrcRe.FindSubmatch(m)
		return []byte(string(sub[1]) + `="` + prefix + string(sub[2]) + `"`)
	})

	// index.html injects the fallback loader script via an absolute path in
	// inline JavaScript: injectJs('/loader.js').
	out = bytes.ReplaceAll(out, []byte(`'/loader.js'`),
		[]byte(`'`+prefix+`/loader.js'`))

	return out
}

func makeMainHandler(indexContent *content) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")

		if path == "" || path == indexPath {
			indexContent.serve(w, r)
			return
		}

		bs, err := Asset(path)
		if err != nil {
			http.Error(w, "Asset not found for path "+path, http.StatusNotFound)
			return
		}

		info, err := AssetInfo(path)
		if err != nil {
			http.Error(w, "AssetInfo not found for path"+path, http.StatusNotFound)
			return
		}

		http.ServeContent(w, r, info.Name(), info.ModTime(), newBuffer(bs))
	}
}

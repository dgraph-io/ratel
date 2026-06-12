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

	prefix := *urlPrefixPtr
	if prefix == "" {
		prefix = os.Getenv("RATEL_URL_PREFIX")
	}
	urlPrefix = normalizeURLPrefix(prefix)
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

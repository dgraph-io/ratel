/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

package server

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
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

	preloadedQueriesPath string
)

// Run starts the server.
func Run() {
	parseFlags()
	indexContent := prepareIndexContent()

	http.HandleFunc("/api/preloaded-queries", handlePreloadedQueries)
	http.HandleFunc("/", makeMainHandler(indexContent))

	addrStr := fmt.Sprintf("%s:%d", listenAddr, port)
	log.Println(fmt.Sprintf("Listening on %s...", addrStr))

	switch {
	case tlsCrt != "":
		log.Fatalln(http.ListenAndServeTLS(addrStr, tlsCrt, tlsKey, nil))
	default:
		log.Fatalln(http.ListenAndServe(addrStr, nil))
	}
}

func parseFlags() {
	portPtr := flag.Int("port", defaultPort, "Port on which the ratel server will run.")
	addrPtr := flag.String("addr", defaultAddr, "Address of the Dgraph server.")
	versionFlagPtr := flag.Bool("version", false, "Prints the version of ratel.")
	tlsCrtPtr := flag.String("tls_crt", "", "TLS cert for serving HTTPS requests.")
	tlsKeyPtr := flag.String("tls_key", "", "TLS key for serving HTTPS requests.")
	listenAddrPtr := flag.String("listen-addr", defaultAddr, "Address Ratel server should listen on.")
	preloadedQueriesPtr := flag.String("preloaded-queries", "",
		"Path to YAML file containing preloaded queries. Can also be set via RATEL_PRELOADED_QUERIES env var.")

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

	// Handle preloaded queries path (flag takes precedence over env var)
	preloadedQueriesPath = *preloadedQueriesPtr
	if preloadedQueriesPath == "" {
		preloadedQueriesPath = os.Getenv("RATEL_PRELOADED_QUERIES")
	}
}

func getAsset(path string) string {
	bs, err := Asset(path)
	if err != nil {
		panic(fmt.Sprintf("Error retrieving \"%s\" asset", path))
	}
	return string(bs)
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
		bs:      buf.Bytes(),
	}
}

func makeMainHandler(indexContent *content) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasPrefix(path, "/") {
			path = path[1:]
		}

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

func handlePreloadedQueries(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if preloadedQueriesPath == "" {
		json.NewEncoder(w).Encode(PreloadedQueriesResponse{
			Enabled: false,
			Queries: []PreloadedQuery{},
		})
		return
	}

	content, err := os.ReadFile(preloadedQueriesPath)
	if err != nil {
		log.Printf("Error reading preloaded queries file: %v", err)
		json.NewEncoder(w).Encode(PreloadedQueriesResponse{
			Enabled: false,
			Queries: []PreloadedQuery{},
		})
		return
	}

	var config PreloadedQueriesConfig
	if err := yaml.Unmarshal(content, &config); err != nil {
		log.Printf("Error parsing preloaded queries YAML: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(PreloadedQueriesResponse{
			Enabled: false,
			Queries: []PreloadedQuery{},
		})
		return
	}

	json.NewEncoder(w).Encode(PreloadedQueriesResponse{
		Enabled: true,
		Queries: config.Queries,
	})
}

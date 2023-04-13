// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package server

import (
	"bytes"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"
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
)

// Run starts the server.
func Run() {
	parseFlags()
	indexContent := prepareIndexContent()

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
	portEnv := getEnvInt("DGRAPH_RATEL_PORT", defaultPort)
	addEnv := getEnvString("DGRAPH_RATEL_ADDRESS", defaultAddr)
	listenAddEnv := getEnvString("DGRAPH_RATEL_LISTEN_ADDRESS", defaultAddr)
	tlsCertEnv := getEnvString("DGRAPH_RATEL_TLS_CRT", "")
	tlsKeyEnv := getEnvString("DGRAPH_RATEL_TLS_KEY", "")

	portPtr := flag.Int("port", portEnv, "Port on which the ratel server will run (can be set via DGRAPH_RATEL_PORT).")
	addrPtr := flag.String("addr", addEnv, "Address of the Dgraph server (can be set via DGRAPH_RATEL_ADDRESS).")
	versionFlagPtr := flag.Bool("version", false, "Prints the version of ratel.")
	tlsCrtPtr := flag.String("tls_crt", tlsCertEnv, "TLS cert for serving HTTPS requests (can be set via DGRAPH_RATEL_TLS_CRT).")
	tlsKeyPtr := flag.String("tls_key", tlsKeyEnv, "TLS key for serving HTTPS requests (can be set via DGRAPH_RATEL_TLS_KEY).")
	listenAddrPtr := flag.String("listen-addr", listenAddEnv, "Address Ratel server should listen on (can be set via DGRAPH_RATEL_LISTEN_ADDRESS).")

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
}

func getEnvString(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		i, err := strconv.Atoi(value)
		if err != nil {
			return fallback
		}
		return i
	}
	return fallback
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

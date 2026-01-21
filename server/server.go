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
	"path/filepath"
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

	queriesDBPath string
)

// Run starts the server.
func Run() {
	parseFlags()

	// Initialize SQLite database if path is provided
	if queriesDBPath != "" {
		if err := InitDB(queriesDBPath); err != nil {
			log.Fatalf("Failed to initialize database: %v", err)
		}
		defer CloseDB()
	}

	indexContent := prepareIndexContent()

	http.HandleFunc("/api/saved-queries/", handleSavedQueryByID) // Must come before /api/saved-queries
	http.HandleFunc("/api/saved-queries", handleSavedQueries)
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
	queriesDBPtr := flag.String("queries-db", "",
		"Path to SQLite database file for saved queries. Can also be set via RATEL_QUERIES_DB env var.")

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

	// Handle queries DB path (flag takes precedence over env var, default to temp dir)
	queriesDBPath = *queriesDBPtr
	if queriesDBPath == "" {
		queriesDBPath = os.Getenv("RATEL_QUERIES_DB")
	}
	if queriesDBPath == "" {
		queriesDBPath = filepath.Join(os.TempDir(), "ratel_queries.db")
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

// handleSavedQueries handles GET (list all) and POST (create) requests
func handleSavedQueries(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check if DB is configured
	if queriesDBPath == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"enabled": false,
			"queries": []SavedQuery{},
		})
		return
	}

	switch r.Method {
	case http.MethodGet:
		queries, err := GetAllQueries()
		if err != nil {
			log.Printf("Error fetching queries: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch queries"})
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"enabled": true,
			"queries": queries,
		})

	case http.MethodPost:
		var input SavedQueryInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON"})
			return
		}

		if input.Name == "" || input.Query == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Name and query are required"})
			return
		}

		query, err := CreateQuery(input)
		if err != nil {
			log.Printf("Error creating query: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create query"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(query)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
	}
}

// handleSavedQueryByID handles PUT (update) and DELETE requests for a specific query
func handleSavedQueryByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check if DB is configured
	if queriesDBPath == "" {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Saved queries not enabled"})
		return
	}

	// Extract ID from URL path: /api/saved-queries/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/saved-queries/")
	id, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid query ID"})
		return
	}

	switch r.Method {
	case http.MethodGet:
		query, err := GetQueryByID(id)
		if err != nil {
			log.Printf("Error fetching query: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch query"})
			return
		}
		if query == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Query not found"})
			return
		}
		json.NewEncoder(w).Encode(query)

	case http.MethodPut:
		var input SavedQueryInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON"})
			return
		}

		if input.Name == "" || input.Query == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Name and query are required"})
			return
		}

		// Check if query exists
		existing, _ := GetQueryByID(id)
		if existing == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Query not found"})
			return
		}

		query, err := UpdateQuery(id, input)
		if err != nil {
			log.Printf("Error updating query: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update query"})
			return
		}

		json.NewEncoder(w).Encode(query)

	case http.MethodDelete:
		// Check if query exists
		existing, _ := GetQueryByID(id)
		if existing == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Query not found"})
			return
		}

		if err := DeleteQuery(id); err != nil {
			log.Printf("Error deleting query: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete query"})
			return
		}

		w.WriteHeader(http.StatusNoContent)

	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
	}
}

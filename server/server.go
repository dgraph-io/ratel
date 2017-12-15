package server

import (
	"bytes"
	"log"
	"net/http"
	"strings"
)

const (
	uiBuildPath = "./ui/build"
)

// Run starts the server.
func Run() {
	http.HandleFunc("/api", apiHandler)
	http.HandleFunc("*", mainHandler)

	log.Println("Listening on port 3000...")
	http.ListenAndServe(":3000", nil)
}

func mainHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if strings.HasPrefix(path, "/") {
		path = path[1:]
	}
	if path == "" {
		path = "index.html"
	}

	bs, err := Asset(path)
	if err != nil {
		http.Error(w, "resource not found", http.StatusNotFound)
		return
	}

	info, err := AssetInfo(path)
	if err != nil {
		http.Error(w, "resource not found", http.StatusNotFound)
		return
	}

	http.ServeContent(w, r, info.Name(), info.ModTime(), newBuffer(bs))
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.EscapedPath()
	if path[0] == '/' {
		path = path[4:]
	} else {
		path = path[4:]
	}

	if len(path) == 0 || path[0] != '/' {
		http.Error(w, "resource not found", http.StatusNotFound)
		return
	}

	var buf bytes.Buffer
	buf.WriteString("localhost:8080")
	buf.WriteString(path)
	if r.URL.RawQuery != "" {
		buf.WriteByte('?')
		buf.WriteString(r.URL.RawQuery)
	}

	http.Redirect(w, r, buf.String(), http.StatusTemporaryRedirect)
}

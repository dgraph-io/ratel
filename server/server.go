package server

import (
	"bytes"
	"log"
	"net/http"
)

const (
	uiBuildPath = "./ui/build"
)

// Run server.
func Run() {
	http.HandleFunc("/api", apiHandler)
	http.HandleFunc("/", makeMainHandler())

	log.Println("Listening...")
	http.ListenAndServe(":3000", nil)
}

func makeMainHandler() http.HandlerFunc {
	fs := http.FileServer(http.Dir(uiBuildPath))

	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, uiBuildPath+"/index.html")
			return
		}

		fs.ServeHTTP(w, r)
	}
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.EscapedPath()
	if path[0] == '/' {
		path = path[4:]
	} else {
		path = path[4:]
	}

	if len(path) == 0 || path[0] != '/' {
		// TODO: ERROR
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

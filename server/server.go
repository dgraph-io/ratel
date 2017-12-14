package server

import (
	"log"
	"net/http"
)

const (
	uiBuildPath = "./ui/build"
)

// Run server.
func Run() {
	http.HandleFunc("/", mainHandler())

	log.Println("Listening...")
	http.ListenAndServe(":3000", nil)
}

func mainHandler() http.HandlerFunc {
	fs := http.FileServer(http.Dir(uiBuildPath))

	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, uiBuildPath+"/index.html")
			return
		}

		fs.ServeHTTP(w, r)
	}
}

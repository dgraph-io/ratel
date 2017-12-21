package server

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

const (
	defaultPort = 8081
)

var (
	port         int
	ratelVersion string
)

// Run starts the server.
func Run() {
	parseFlags()

	http.HandleFunc("/", mainHandler)

	log.Println(fmt.Sprintf("Listening on port %d...", port))
	log.Fatalln(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}

func parseFlags() {
	portPtr := flag.Int("p", defaultPort, "Port on which the ratel server will run.")
	version := flag.Bool("version", false, "Prints the version of ratel.")
	flag.Parse()

	if *version {
		fmt.Printf("Ratel Version: %s\n", ratelVersion)
		os.Exit(0)
	}

	port = *portPtr
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

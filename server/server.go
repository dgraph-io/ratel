package server

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
)

const (
	defaultPort = 8081
	defaultAddr = "localhost:8080"

	clientBuildStaticPath = "./client/build/static"
)

var (
	devMode bool
	port    int
	addr    string
)

// Run starts the server.
func Run() {
	parseFlags()

	if devMode {
		fs := http.FileServer(http.Dir(clientBuildStaticPath))
		http.Handle("/cdn/static/", http.StripPrefix("/cdn/static/", fs))
	}
	http.HandleFunc("/", mainHandler)

	log.Println(fmt.Sprintf("Listening on port %d...", port))
	log.Fatalln(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}

func parseFlags() {
	devModePtr := flag.Bool("dev", false, "Run hedgehog in dev mode (requires ./cdn/static/ aith all the necessary assets)")
	portPtr := flag.Int("p", defaultPort, "Port on which the hedgehog server will run")
	addrPtr := flag.String("addr", defaultAddr, "Dgraph server address (host or host:port)")
	flag.Parse()

	devMode = *devModePtr
	port = *portPtr
	addr = *addrPtr

	// TODO: add verification
	// TODO: allow passing scheme and other options in addrPtr
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

func staticHandler(w http.ResponseWriter, r *http.Request) {
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

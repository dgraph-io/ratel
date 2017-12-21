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

	clientBuildStaticPath = "./client/build/static"
)

var (
	devMode      bool
	port         int
	ratelVersion string
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
	devModePtr := flag.Bool(
		"dev",
		false,
		fmt.Sprintf("Run ratel in dev mode (requires %s with all the necessary assets).", clientBuildStaticPath),
	)
	portPtr := flag.Int("p", defaultPort, "Port on which the ratel server will run.")
	version := flag.Bool("version", false, "Prints the version of ratel.")

	flag.Parse()

	if *version {
		fmt.Printf("Ratel Version: %s\n", ratelVersion)
		os.Exit(0)
	}

	devMode = *devModePtr
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

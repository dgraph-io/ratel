package server

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

const (
	defaultPort = 8081
	defaultAddr = "localhost:8080"

	uiBuildStaticPath = "./ui/build/static"
)

var (
	devMode      bool
	port         int
	addr         string
	ratelVersion string
)

// Run starts the server.
func Run() {
	parseFlags()

	http.HandleFunc("/api/", apiHandler)
	if devMode {
		http.Handle("/cdn/static/", http.FileServer(http.Dir(uiBuildStaticPath)))
	}
	http.HandleFunc("/", mainHandler)

	log.Println(fmt.Sprintf("Listening on port %d...", port))
	log.Fatalln(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}

func parseFlags() {
	devModePtr := flag.Bool("dev", false, "Run ratel in dev mode (requires ./cdn/static/ aith all the necessary assets)")
	portPtr := flag.Int("p", defaultPort, "Port on which the ratel server will run")
	addrPtr := flag.String("addr", defaultAddr, "Dgraph server address (host or host:port)")
	version := flag.Bool("version", false, "Prints the version of ratel.")
	flag.Parse()

	if *version {
		log.Printf("Ratel Version: %q\n", ratelVersion)
	}
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

func apiHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.EscapedPath()
	if path[0] == '/' {
		path = path[4:]
	} else {
		path = path[3:]
	}

	if len(path) == 0 || path[0] != '/' {
		http.Error(w, "resource not found", http.StatusNotFound)
		return
	}

	r.URL.Scheme = "http"
	r.URL.Opaque = ""
	r.URL.User = nil
	r.URL.Host = addr

	r.URL.Path = path
	if escp := url.PathEscape(path); escp == path {
		r.URL.RawPath = ""
	} else {
		r.URL.RawPath = path
	}

	resp, err := http.DefaultTransport.RoundTrip(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	copyHeaders(w.Header(), resp.Header)
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func copyHeaders(dst, src http.Header) {
	for k := range dst {
		dst.Del(k)
	}
	for k, vs := range src {
		for _, v := range vs {
			dst.Add(k, v)
		}
	}
}

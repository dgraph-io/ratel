// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"strings"

	homedir "github.com/mitchellh/go-homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const (
	defaultPort   = 8000
	defaultAddr   = "localhost"
	defaultAlpha  = ""
	defaultTLSCrt = ""
	defaultTLSKey = ""

	indexPath = "index.html"
)

var (
	port           int
	addr           string
	version        string
	branch         string
	lastCommitSHA1 string
	lastCommitTime string

	tlsCrt string
	tlsKey string

	listenAddr string

	cfgFile string

	rootCmd = &cobra.Command{
		Use:   "ratel",
		Short: "Ratel is a Dgraph UI.",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Starting Ratel UI\n", printversion())
			Run()
		},
	}
)

func printversion() string {
	return fmt.Sprintf(`
Ratel version    : %v
Commit SHA-1     : %v
Commit timestamp : %v
Branch           : %v

For Dgraph official documentation, visit https://docs.dgraph.io.
For discussions about Dgraph     , visit https://discuss.dgraph.io.
To say hi to the community       , visit https://dgraph.slack.com.

Licensed variously under the Apache Public License 2.0 and Dgraph Community License.
Copyright 2015-2020 Dgraph Labs, Inc.
	`,
		version, lastCommitSHA1, lastCommitTime, branch)

}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

// Run starts the server.
func Run() {
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
func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().IntVarP(&port, "port", "p", defaultPort,
		"Port on which the ratel server will run.")
	rootCmd.PersistentFlags().StringVarP(&addr, "addr", "d", defaultAlpha,
		"Address of the Dgraph Alpha.")
	rootCmd.PersistentFlags().StringVarP(&tlsCrt, "tls_crt", "c", defaultTLSCrt,
		"TLS cert for serving HTTPS requests.")
	rootCmd.PersistentFlags().StringVarP(&tlsKey, "tls_key", "k", defaultTLSKey,
		"TLS key for serving HTTPS requests.")
	rootCmd.PersistentFlags().StringVarP(&listenAddr, "listen-addr", "l", defaultAddr,
		"Address Ratel UI server should listen on.")

	viper.BindPFlag("port", rootCmd.PersistentFlags().Lookup("port"))

	viper.BindPFlag("addr", rootCmd.PersistentFlags().Lookup("addr"))
	viper.BindPFlag("tlsCrt", rootCmd.PersistentFlags().Lookup("tls_crt"))
	viper.BindPFlag("tlsKey", rootCmd.PersistentFlags().Lookup("tls_key"))
	viper.BindPFlag("listenAddr", rootCmd.PersistentFlags().Lookup("listen-addr"))
}
func er(msg interface{}) {
	fmt.Println("Error:", msg)
	os.Exit(1)
}
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := homedir.Dir()
		if err != nil {
			er(err)
		}

		// Search config in home directory with name ".cobra" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigName(".cobra")
	}

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
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

#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

# Build ui files.
cd ui
npm run build
npm test

# cd to root directory.
cd ..

# Run bindata for index.html.
$GOPATH/bin/go-bindata -prefix "./ui/build" ./ui/build/index.html

# Build the Go binary.
go build -o build/hedgehog

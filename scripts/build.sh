#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

# Build client files.
cd clint

if [ ! -d "node_modules" ]; then
  npm install
fi

npm run build
npm test

# cd to root directory.
cd ..

# Run bindata for all files in in client/build/ (non-recursive).
$GOPATH/bin/go-bindata -o ./server/bindata.go -pkg server -prefix "./client/build" ./client/build/

# Build the Go binary.
go build -o build/ratel

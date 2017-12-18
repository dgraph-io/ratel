#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

<<<<<<< HEAD
# Build client files.
cd client
=======
# Build ui files.
cd ui

if [ ! -d "node_modules" ]; then
  npm install
fi

>>>>>>> 44b00945ff89ff3e4ced39850892cc93dff2929c
npm run build
npm test

# cd to root directory.
cd ..

# Run bindata for all files in in client/build/ (non-recursive).
$GOPATH/bin/go-bindata -o ./server/bindata.go -pkg server -prefix "./client/build" ./client/build/

# Build the Go binary.
go build -o build/ratel

#!/usr/bin/env sh

# Build client files.
function buildClient {
    echo "\n=> Building client files..."

    cd client

    if [ ! -d "node_modules" ]; then
        npm install
    fi

    # Check if production build.
    if [ $1 = true ]; then
        npm run build
        npm test
    else
        CDN_PATH="/cdn/" npm run build
        CDN_PATH="/cdn/" npm test
    fi

    # cd to root directory.
    cd ..
}

# Start client in development mode.
function startClient {
    echo "\n=> Starting client in development mode..."

    cd client

    if [ ! -d "node_modules" ]; then
        npm install
    fi

    npm start

    # cd to root directory.
    cd ..
}

# Build server files.
function buildServer {
    echo "\n=> Building server files..."

    # Run bindata for all files in in client/build/ (non-recursive).
    $GOPATH/bin/go-bindata -o ./server/bindata.go -pkg server -prefix "./client/build" ./client/build/

    # Build the Go binary.
    go build -o build/ratel
}

# Upload client static files to AWS S3.
function uploadToS3 {
    echo "\n=> Uploading client static files to AWS S3..."
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/static
}

#!/usr/bin/env sh

# Build client files.
function buildClient {
    echo
    echo "=> Building client files..."

    cd client

    # Install all or missing dependencies.
    if hash yarn 2>/dev/null; then
        # if yarn is installed use it. much faster than npm
        yarn install
    else
        npm install
    fi

    # Check if production build.
    if [ $1 = true ]; then
        npm run build:prod
    else
        npm run build:local
    fi

    # cd to root directory.
    cd ..
}

# Build server files.
function buildServer {
    echo
    echo "=> Building server files..."

    # Run bindata for all files in in client/build/ (recursive).
    go get github.com/jteeuwen/go-bindata/go-bindata
    $GOPATH/bin/go-bindata -o ./server/bindata.go -pkg server -prefix "./client/build" -ignore=DS_Store ./client/build/...

    # Check if production build.
    if [ $1 = true ]; then
        ldflagsVal="-X github.com/dgraph-io/ratel/server.mode=prod"
    else
        ldflagsVal="-X github.com/dgraph-io/ratel/server.mode=local"
    fi

    # Check if second argument (version) is present and not empty.
    if [ -n $2 ]; then
        ldflagsVal="$ldflagsVal -X github.com/dgraph-io/ratel/server.version=$2"
    fi

    # Build the Go binary with linker flags.
    go build -ldflags="$ldflagsVal" -o build/ratel
}

# Upload client static files to AWS S3.
function uploadToS3 {
    echo
    echo "=> Uploading client static files to AWS S3..."
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/dev/static
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/static
    aws cloudfront create-invalidation --distribution-id EJF7H0N2C94FP --paths "/*"
}

# Run Dgraph cluster using the compose tool
# at https://github.com/dgraph-io/dgraph/tree/master/compose
# You must have the GOPATH set and go installed to build the
# compose tool.
function restartCluster {
    pushd $GOPATH/github.com/dgraph-io/dgraph/compose
    go build
    compose --num_alphas=1 --num_zeros=1 --port_offset=0
    docker-compose up --force-recreate --remove-orphans --detach
}

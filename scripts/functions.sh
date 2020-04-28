#!/usr/bin/env sh

# Build client files.
function buildClient {
    printf "\n=> Building client files..."
    # cd to client directory
    pushd client
        # Install all or missing dependencies.
        if hash yarn 2>/dev/null; then
            # if yarn is installed use it. much faster than npm
            yarn install
        else
            npm install
        fi

        # Check if production build.
        if [ "$1" = true ]; then
            npm run build:prod
        else
            npm run build:local
        fi
    # cd to root directory.
    popd > /dev/null
}

function doChecks {
    if ! hash go 2>/dev/null; then
		printf "Could not find golang. Please install Go env and try again.";
		exit 1;
	fi

    if hash go-bindata 2>/dev/null; then
        go_bindata="$(which go-bindata)"
    else
        printf "Could not find go-bindata. Make sure ratel is in the GOPATH and GOBIN environment variable is set.";
        printf "Trying to install go-bindata. If it fails, please read the INSTRUCTIONS.md.";
        go get github.com/jteeuwen/go-bindata/go-bindata
        sleep 2
        go_bindata="$(which go-bindata)"
    fi
}

# Build server files.
function buildServer {
    doChecks
    printf "\n=> Building server files..."

    # Run bindata for all files in in client/build/ (recursive).
    $go_bindata -o ./server/bindata.go -pkg server -prefix "./client/build" -ignore=DS_Store ./client/build/...

    # Check if production build.
    if [ "$1" = true ]; then
        ldflagsVal="-X github.com/dgraph-io/ratel/server.mode=prod"
    else
        ldflagsVal="-X github.com/dgraph-io/ratel/server.mode=local"
    fi

    # Check if second argument (version) is present and not empty.
    if [ -n "$2" ]; then
        ldflagsVal="$ldflagsVal -X github.com/dgraph-io/ratel/server.version=$2"
    fi

    # This is necessary, as the go build flag "-ldflags" won't work with spaces.
    escape="$(printf '%s' "$commitINFO" | sed -e "s/ /¨•¨/g")"
    
    ldflagsVal="$ldflagsVal -X github.com/dgraph-io/ratel/server.commitINFO=$escape"
    ldflagsVal="$ldflagsVal -X github.com/dgraph-io/ratel/server.commitID=$commitID"

    # Get packages before build
    go get ./
    # Build the Go binary with linker flags.
    go build -ldflags="$ldflagsVal" -o build/ratel
}

# Upload client static files to AWS S3.
function uploadToS3 {
    printf "\n=> Uploading client static files to AWS S3..."
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/dev/static
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/static
    aws cloudfront create-invalidation --distribution-id EJF7H0N2C94FP --paths "/*"
}

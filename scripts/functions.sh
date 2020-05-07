#!/usr/bin/env sh

# Build client files.
function buildClient {
    echo
    echo "=> Building client files..."

    cd client

    # Install nodejs dependencies.
    npm install

    # Check if production build.
    if [ $1 = true ]; then
        npm run build:prod
    else
        npm run build:local
    fi

    # cd to root directory.
    cd ..
}

function doChecks {
  if ! hash go 2>/dev/null; then
    echo "Could not find golang. Please install Go env and try again.";
    exit 1;
  fi

  if ! hash go-bindata 2>/dev/null; then
    echo "Could not find go-bindata. Trying to install go-bindata."
    go get -u github.com/go-bindata/go-bindata/...

    if ! hash go-bindata 2>/dev/null; then
      echo "ERROR: Unable to install go-bindata"
      echo "Try adding GOPATH to PATH: export PATH=\"\$HOME/go/bin:\$PATH\""
      exit 1;
    fi
  fi
}

# Build server files.
function buildServer {
    doChecks
    echo
    echo "=> Building server files..."

    # Run bindata for all files in in client/build/ (recursive).
    go-bindata -fs -o ./server/bindata.go -pkg server -prefix "./client/build" -ignore=DS_Store ./client/build/...
    if [[ $? -ne 0 ]] ; then
      echo go-bindata returned an error. Exiting. Attempted command: $go_bindata
      exit 1
    fi

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

    # This is necessary, as the go build flag "-ldflags" won't work with spaces.
    escape=$(echo $commitINFO | sed -e "s/ /¨•¨/g")

    ldflagsVal="$ldflagsVal -X github.com/dgraph-io/ratel/server.commitINFO=$escape"
    ldflagsVal="$ldflagsVal -X github.com/dgraph-io/ratel/server.commitID=$commitID"

    # Get packages before build
    go get ./
    # Build the Go binary with linker flags.
    go build -ldflags="$ldflagsVal" -o build/ratel

    if [[ $? -ne 0 ]] ; then
      echo go build returned an error. Exiting.
      exit 1
    fi
}

# Upload client static files to AWS S3.
function uploadToS3 {
    echo
    echo "=> Uploading client static files to AWS S3..."
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/dev/static
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/static
    aws cloudfront create-invalidation --distribution-id EJF7H0N2C94FP --paths "/*"
}

#!/usr/bin/env sh

# Build client files.
function buildClient {
    printf "\n=> Building client files...\n"
    # change to client directory
    pushd client > /dev/null || exit
        # Install all or missing dependencies.
        npm install

        # Check if production build.
        if [ "$1" = true ]; then
            npm run build:prod
        else
            npm run build:local
        fi
    # cd to root directory.
    popd > /dev/null || exit
}

function installGoBinData {
    go get -u github.com/go-bindata/go-bindata/...

    if ! hash go-bindata 2>/dev/null; then
      echo "ERROR: Unable to install go-bindata"
      echo "Try adding GOPATH to PATH: export PATH=\"\$HOME/go/bin:\$PATH\""
      exit 1;
    fi
}

function doChecks {
  if ! hash go 2>/dev/null; then
		printf "Could not find golang. Please install Go env and try again.\n";
		exit 1;
	fi

  if ! hash go-bindata 2>/dev/null; then
    echo "Could not find go-bindata. Trying to install go-bindata."
    installGoBinData
  fi

  if ! go-bindata 2>&1 | grep -- -fs > /dev/null; then 
    echo "You might have the wrong version of go-bindata. Updating now"
    installGoBinData
  fi
}

# Build server files.
function buildServer {
    doChecks
    printf "\n=> Building server files...\n"

    # Declaring variables used which are assigned in build script
    declare go_bindata
    declare commitID
    declare commitINFO

    # Run bindata for all files in in client/build/ (recursive).
    go-bindata -fs -o ./server/bindata.go -pkg server -prefix "./client/build" -ignore=DS_Store ./client/build/...
    EXIT_STATUS=$?
    if [ $EXIT_STATUS -ne 0 ]; then
      echo "go-bindata returned an error. Exiting. Attempted command: $go_bindata"
      exit 1
    fi

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
    EXIT_STATUS=$?
    if [ $EXIT_STATUS -ne 0 ]; then
      echo go build returned an error. Exiting.
      exit 1
    fi
}

# Upload client static files to AWS S3.
function uploadToS3 {
    printf "\n=> Uploading client static files to AWS S3...\n"
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/dev/static
    aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/static
    aws cloudfront create-invalidation --distribution-id EJF7H0N2C94FP --paths "/*"
}

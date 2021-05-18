# Building and running ratel

## Local development

### 1. Download the repository

```sh
go get -u github.com/dgraph-io/ratel
```

You may see errors when you run the above command:

```
# github.com/dgraph-io/ratel/server
go/src/github.com/dgraph-io/ratel/server/server.go:99:13: undefined: Asset
go/src/github.com/dgraph-io/ratel/server/server.go:107:13: undefined: Asset
go/src/github.com/dgraph-io/ratel/server/server.go:112:15: undefined: AssetInfo
go/src/github.com/dgraph-io/ratel/server/server.go:154:14: undefined: Asset
go/src/github.com/dgraph-io/ratel/server/server.go:160:16: undefined: AssetInfo
```

These errors can be ignored at this stage.

### 2. Build ratel

```sh
# Build ratel
# NOTE: ratel needs to be in your GOPATH for this to work.
cd go/src/github.com/dgraph-io/ratel/
./scripts/build.prod.sh

# Start the ratel server.
./build/ratel
# Visit localhost:8000 to use ratel.
```

#### 2.1. Using WebpackDevServer for fast re-compilation of JavaScript

```sh
cd client/
npm start
# Visit localhost:3000 to use ratel.
```

## Docker Image

```bash
make build
```

## Testing

### Using npm

```bash
unset USE_DOCKER
pushd client && npm install && popd # node_modules
make test
```

## Using docker-exec

```bash
export USE_DOCKER=1
make test
```


## Production build

```sh
./scripts/build.prod.sh
# Or if you want to override version:
./scripts/build.prod.sh --version 20.04.1
```

## Serving over HTTPS

By default Ratel will serve the UI over HTTP. You can switch to serve the UI with **only** HTTPS by
setting the `-tls_crt` and `-tls_key` flags with the certificate and key files used to establish the
HTTPS connection.

```
./build/ratel -tls_crt example.crt -tls_key example.key
```

## Publishing to AWS S3

Instructions to publish ratel assets (JS and CSS files)
to AWS S3 bucket.

### Before publishing

- Install the AWS CLI -
  [see docs](https://docs.aws.amazon.com/cli/latest/userguide/installing.html).
- Get access to AWS credentials and configure the AWS CLI -
  [see docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html).

### Publishing

```sh
# Builds the Go server and JS and CSS client files. Also uploads the JS and CSS
# files to AWS S3.
./scripts/build.prod.sh --upload
```

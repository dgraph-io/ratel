# Building and running ratel

## Developing via Container

The safest way to develop and run this repository is via the Docker container. Because we will
create a predictable environment using Docker images with nodeJS in the version that this app was
developed. And for that you need to have VSCode installed. And then you can use the remote access
feature built into VSCode in the "ms-vscode-remote.remote-containers" extension.

Follow the step by step:

1. Install Docker locally and VSCode.
2. Install Docker extension, and Dev Containers extension in VsCode.
3. Run `docker-compose up` in the path of this repository.
4. Click on "Remote Explorer" on the side of your VSCode.
5. In the Dropdown menu choose "Containers". It will display all running and stopped containers.
6. Right click on "rate" or "ratel-dev-1" and click on "Attach to Container". In 1 minute or less,
   remote access is set up. 7 - When you see "`container node:14.17.0...`" in the left part of the
   footer of VsCode. Open the terminal and run `npm cache clean --force` and then
   `npm install --legacy-peer-deps --no-optional`.
7. Finally run `npm run start`

Docker will forward the port. It will automatically run the Dashboard in your browser. And you can
choose to use VSCode locally or in Container. But it's important to leave that connection open. Both
Local and Remote windows in the container you can write. As long as the connection is open, writing
is bound.

PS. This was tested in Windows 11. Using Docker and WSL.

## Local development

### 1. Download the repository

```sh
go install github.com/dgraph-io/ratel@latest
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
npm cache clean --force
npm install --legacy-peer-deps --no-optional
npm start
# Visit localhost:3000 to use ratel.
```

## Docker Image

```bash
make build
```

## Testing

### Set Desired Dgraph Version

```bash
export DGRAPH_VERSION=latest
```

### Using npm

```bash
unset USE_DOCKER
pushd client && run npm cache clean --force && npm install --legacy-peer-deps --no-optional && popd # node_modules
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

Instructions to publish ratel assets (JS and CSS files) to AWS S3 bucket.

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

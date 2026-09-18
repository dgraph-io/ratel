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
6. Right click on the `dev` container — listed as `<folder>-dev-1`, so `ratel-dev-1` if you cloned
   into `ratel` — and click on "Attach to Container". In 1 minute or less, remote access is set up.
7. Open a terminal in the container and run `./dev/run.sh`, which installs the dependencies and
   starts the dev server.

If you would rather run the steps yourself, note both of these, because the obvious commands do not
work:

```sh
cd client                   # package.json lives here, not at the repository root
npm ci --legacy-peer-deps   # not npm install, and the flag is required — see below
npm run start
```

`npm ci` installs the versions in `package-lock.json`, which are the ones CI builds and tests with.
`npm install` is free to pick newer minors, and at the time of writing that resolves a
`react-draggable` whose `.mjs` build webpack cannot resolve, so the bundle fails to compile — while
the dev server still starts and serves a page, which makes it a confusing way to fail. `npm install`
also rewrites `package-lock.json`, which is easy to commit by mistake.

`--legacy-peer-deps` is required rather than optional: the tree holds React 18 while
`@wojtekmaj/enzyme-adapter-react-17` asks for React 17, so a bare `npm ci` stops with `ERESOLVE` and
installs nothing. `dev/run.sh` and CI pass the same flag.

Docker will forward the port. It will automatically run the Dashboard in your browser. And you can
choose to use VSCode locally or in Container. But it's important to leave that connection open. Both
Local and Remote windows in the container you can write. As long as the connection is open, writing
is bound.

## Local development

### 1. Download the repository

```sh
go install github.com/dgraph-io/ratel@latest
```

You may see errors when you run the above command:

```text
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

## Code style and formatting

Formatting is enforced by [Trunk](https://docs.trunk.io), configured in
[`.trunk/trunk.yaml`](.trunk/trunk.yaml). Trunk routes each file type to a formatter:

- **JS / JSX / JSON** → Biome, configured in
  [`.trunk/configs/biome.json`](.trunk/configs/biome.json)
- **SCSS / CSS / Markdown / YAML** → Prettier, configured in
  [`.trunk/configs/.prettierrc`](.trunk/configs/.prettierrc)

For JS this repo's Biome config is **2-space indent, single quotes, and no semicolons** — which
differs from Biome's out-of-the-box defaults (tabs, double quotes, semicolons). So format through
the repo config rather than an editor's bundled formatter, or you'll churn every file you touch and
fail CI:

```bash
cd client/
npm run lint   # runs `trunk fmt` against the repo config
```

If your editor formats on save, point its Biome/Prettier integration at the configs under
`.trunk/configs/` (the Trunk VSCode extension does this automatically), or turn format-on-save off
and rely on `npm run lint`.

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

```bash
./build/ratel -tls_crt example.crt -tls_key example.key
```

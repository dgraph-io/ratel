# Running via container

## Requirements

- Docker
- Docker Compose

## Running in background

```bash
docker-compose up -d
```

## Attach to container

```bash
docker-compose exec dev sh
```

## Running the start script

if you already attached to the container, you can run the start script directly

```bash
./dev/run.sh
```

or you can run the start script from outside the container

```bash
docker-compose exec dev ./dev/run.sh
```

# Node.js version

Use the version in `.nvmrc`, which is what CI and the production image build with. With
[NVM](https://github.com/nvm-sh/nvm) installed, from the repository root:

```bash
nvm install
nvm use
```

Older versions will not work. Node 14 in particular ships npm 6, which cannot read this repository's
`package-lock.json` (lockfileVersion 3) — it ignores the lockfile, installs newer dependencies than
CI uses, and the webpack build then fails to compile. It also rewrites the lockfile to an older
format on the way past.

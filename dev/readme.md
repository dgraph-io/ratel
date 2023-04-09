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
docker exec -it ratel_dev_1 bash
```

## Running the start script


if you already attached to the container, you can run the start script directly

```bash
bash ./dev/run.sh
```

or you can run the start script from outside the container

```bash
docker exec -it ratel_dev_1 bash -c "bash ./dev/run.sh"
```


# Issues with Node.js

To run this project locally you have to use Node.js version 14.x. If you have a different version installed, you will get errors when running the development server.


To downgrade Node.js, you can use the Node Version Manager (NVM). If you don't have NVM installed, you can install it with the following command:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

After installing NVM, restart your terminal or run:


```bash
source ~/.bashrc
```

Now, you can install a compatible Node.js version. For example, to install Node.js 14.x, run:


```bash

nvm install 14
```

To switch to the newly installed version:

```bash
nvm use 14
```

After downgrading your Node.js version, try running your development server again. The error should be resolved, and your project should work as expected.
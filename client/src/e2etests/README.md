## End-to-end tests

Run tests with Docker Compose config using dev build of Ratel and Puppeteer container:

```sh
docker-compose -f docker-compose.dev.yml up
sleep 30
docker exec e2etests_ratel-dev_1 bash -c "cd /workdir && TEST_DGRAPH_SERVER=http://server:8080 JEST_PPTR_DOCKER=1  npm test"
```

Run tests with Docker Compose config using prod build of Ratel and locally installed Puppeteer:

```sh
../../../scripts/test.sh
```

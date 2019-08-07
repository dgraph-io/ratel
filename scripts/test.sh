#!/bin/bash

dir="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )" && pwd )"
cd "$dir"

cd ..

# Can't use ./build.prod.sh because we need to build the Ratel first and then
# 1. Run Ratel with -addr=http://localhost:8180
# 2. Run Dgraph test cluster
# 3. Run the tests with RATEL_TEST_URL.
# pushd client
#   yarn install
#   npm run build:prod
# popd
# 
# buildServer true

./scripts/build.prod.sh

# For E2E tests: Run Ratel and Dgraph Cluster
# Ratel: localhost:3000
# Dgraph: localhost:8180 (HTTP)
ratel=$(docker run --rm --detach -p 3000:3000 -v $(pwd)/build/ratel:/ratel dgraph/dgraph:latest /ratel -port=3000 -addr="http://localhost:8180")


(cd "$dir"; docker-compose -p ratel-test-cluster up --force-recreate --remove-orphans --detach)
./scripts/wait-for-it.sh -t 60 localhost:8180
./scripts/wait-for-it.sh -t 60 localhost:6180

pushd client > /dev/null
# Workaround: Use ?local to run production Ratel builds for e2e tests
TEST_DGRAPH_SERVER="http://localhost:8180" RATEL_TEST_URL="http://localhost:3000?local" npm test
testresults="$?"
popd

# cleanup
(cd "$dir"; docker-compose -p ratel-test-cluster down && docker-compose -p ratel-test-cluster rm -f)
docker stop $ratel
exit $testresults

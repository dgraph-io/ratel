#!/bin/bash

dir="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )" && pwd )"
cd "$dir"

cd ..

./scripts/build.prod.sh

# For E2E tests: Run Ratel and Dgraph Cluster
# Ratel: localhost:3000
# Dgraph: localhost:8180 (HTTP)
ratel=$(docker run --rm --detach -p 3000:3000 -v $(pwd)/build/ratel:/ratel dgraph/dgraph:latest /ratel -port=3000 -addr="http://localhost:8180")

(cd "$dir"; docker-compose  up --force-recreate --remove-orphans --detach)
./scripts/wait-for-it.sh -t 60 localhost:8180
./scripts/wait-for-it.sh -t 60 localhost:6180

pushd client > /dev/null
# Workaround: Use ?local to run production Ratel builds for e2e tests
TEST_DGRAPH_SERVER="http://localhost:8180" TEST_RATEL_URL="http://localhost:3000?local" npm test
testresults="$?"
popd

# cleanup
(cd "$dir"; docker-compose down && docker-compose rm -f)
docker stop $ratel
exit $testresults

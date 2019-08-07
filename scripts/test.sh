#!/bin/bash

dir="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )" && pwd )"
clientdir="$dir/../client"
composedir="$clientdir/src/e2etests"
cd "$dir"

cd ..

./scripts/build.prod.sh

# Run Ratel and Dgraph
pushd "$composedir" > /dev/null
  docker-compose up --force-recreate --remove-orphans --detach
popd
./scripts/wait-for-it.sh -t 60 localhost:8080
./scripts/wait-for-it.sh -t 60 localhost:6080

# Run tests
pushd "$clientdir" > /dev/null
  # Workaround: Use ?local to run production Ratel builds for e2e tests
  TEST_DGRAPH_SERVER="http://localhost:8080" TEST_RATEL_URL="http://localhost:8000?local" npm test
  testresults="$?"
popd

# Cleanup
pushd "$composedir" > /dev/null
  docker-compose down && docker-compose rm -f
popd
exit $testresults

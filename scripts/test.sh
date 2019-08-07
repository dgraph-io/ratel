#!/bin/bash

function wait-for-healthy() {
    echo "wait-for-healthy: Waiting for $1 to return 200 OK"
    timeout=
    until curl -sL -w "%{http_code}\\n" "$1" -o /dev/null | grep -q 200; do
          sleep 0.2
    done
    echo "wait-for-healthy: Done."
}

dir="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )" && pwd )"
rootdir="$dir/.."
clientdir="$dir/../client"
composedir="$clientdir/src/e2etests"

export COMPOSE_FILE=docker-compose.prod.yml

cd "$rootdir"

./scripts/build.prod.sh

# Run Ratel and Dgraph
pushd "$composedir" > /dev/null
  (set -e
   docker-compose up --force-recreate --remove-orphans --detach
   )
popd
./scripts/wait-for-it.sh -t 60 localhost:8080
./scripts/wait-for-it.sh -t 60 localhost:6080
wait-for-healthy localhost:8080/health

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

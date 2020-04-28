#!/bin/bash

# Run Dgraph cluster and prod-build of Ratel to run Ratel tests
# (including end-to-end tests).
# The script returns with exit-code 0 if the tests pass, and non-zero
# exit code if the tests fail.
# You must have Puppeteer installed locally for these tests to run.
# "npm test" runs on the local machine.

function wait-for-healthy() {
    printf 'wait-for-healthy: Waiting for %s to return 200 OK' "$1"
    tries=0
    until curl -sL -w "%{http_code}\\n" "$1" -o /dev/null | grep -q 200; do
        tries=$tries+1
        if [[ $tries -gt 300 ]]; then
            printf "wait-for-healthy: Took longer than 1 minute to be healthy."
            printf "wait-for-healthy: Waiting stopped."
            return 1
        fi
        sleep 0.2
    done
    printf "wait-for-healthy: Done."
}

dir="$( dirname "${BASH_SOURCE[0]}" )"
rootdir="$dir/.."
clientdir="$dir/../client"
composedir="$clientdir/src/e2etests"

pushd "$dir" > /dev/null
  # Use this file for docker-compose commands
  export COMPOSE_FILE=docker-compose.prod.yml
  pushd "$rootdir" > /dev/null

  if [ ! -f "$rootdir/build/ratel" ]; then
      ./scripts/build.prod.sh
  fi

  pwd
  ls -lah build/

  # Run Ratel and Dgraph
  pushd "$composedir" > /dev/null
    set -e
    docker-compose up --force-recreate --remove-orphans --detach
    set +e
  popd > /dev/null

  # Verifying that the docker containers are up and running
  docker ps
  wait-for-healthy localhost:8080/health
  wait-for-healthy localhost:8000

  # Run tests
  pushd "$clientdir" > /dev/null
    # Workaround: Use ?local to run production Ratel builds for e2e tests
    TEST_DGRAPH_SERVER="http://localhost:8080" TEST_RATEL_URL="http://localhost:8000?local" \
      npm test -- --runInBand --testTimeout 40000
    testresults="$?"
  popd > /dev/null

  # Cleanup
  pushd "$composedir" > /dev/null
    docker-compose down && docker-compose rm -f
  popd > /dev/null
popd > /dev/null

exit $testresults

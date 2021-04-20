#!/bin/bash

# Run Dgraph cluster and prod-build of Ratel to run Ratel tests
# (including end-to-end tests).
# The script returns with exit-code 0 if the tests pass, and non-zero
# exit code if the tests fail.
# You must have Puppeteer installed locally for these tests to run.
# "yarn test" runs on the local machine.

function wait-for-healthy() {
    printf "wait-for-healthy($1): Waiting for %s to return 200 OK\n" "$2"
    tries=0
    until curl -sL -w "%{http_code}\\n" "$2" -o /dev/null | grep -q 200; do
        tries=$tries+1
        if [[ $tries -gt 300 ]]; then
            printf "wait-for-healthy($1): Took longer than 1 minute to be healthy.\n"
            printf "wait-for-healthy($1): Waiting stopped.\n"
            return 1
        fi
        sleep 0.2
    done
    printf "wait-for-healthy($1): Done.\n"
}

dir="$( cd "$( printf '%s' "${BASH_SOURCE[0]%/*}" )" && pwd )"
rootdir="$dir/.."
clientdir="$dir/../client"
composedir="$clientdir/src/e2etests"

pushd "$dir" > /dev/null
  # Use this file for docker-compose commands
  export COMPOSE_FILE=docker-compose.prod.yml
  pushd "$rootdir" > /dev/null

  if [ ! -f "$rootdir/build/ratel" ]; then
    echo Ratel binary not found. Starting full build. Tested path: "$rootdir/build/ratel"
    ./scripts/build.prod.sh
  fi

  # Run Ratel and Dgraph
  pushd "$composedir" > /dev/null
    set -e
    # TODO: remove the following two calls to `docker-compose down`
    docker-compose down
    docker-compose -p ratel_test down
    docker-compose up --force-recreate --remove-orphans --detach
    sleep 5
    set +e
  popd > /dev/null

  # Verifying that the docker containers are up and running
  docker ps
  ratelport="$(docker container port e2etests_ratel_1 8000 | awk -F':' '{print $2}')"
  alphaport="$(docker container port e2etests_alpha_1 8080 | awk -F':' '{print $2}')"

  wait-for-healthy "Alpha" localhost:$alphaport/health
  wait-for-healthy "Ratel" localhost:$ratelport

  # Run tests
  pushd "$clientdir" > /dev/null
    # Workaround: Use ?local to run production Ratel builds for e2e tests
    TEST_DGRAPH_SERVER="http://localhost:$alphaport" TEST_RATEL_URL="http://localhost:$ratelport?local" \
      npm test -- --runInBand --testTimeout 40000 --watchAll=false
    testresults="$?"
  popd > /dev/null

  if [ $testresults != 0 ]; then
      docker-compose logs
  fi

  # Cleanup
  pushd "$composedir" > /dev/null
    docker-compose down && docker-compose rm -f
  popd > /dev/null
popd > /dev/null

exit $testresults

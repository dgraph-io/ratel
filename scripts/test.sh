#!/bin/bash
if [[ $DEGUG == "1" ]]; then set -x; fi
# Run Dgraph cluster and prod-build of Ratel to run Ratel tests
# (including end-to-end tests).
# The script returns with exit-code 0 if the tests pass, and non-zero
# exit code if the tests fail.
# You must have Puppeteer installed locally for these tests to run.
# "yarn test" runs on the local machine.

function wait-for-healthy() {
    echo "wait-for-healthy($1): Waiting for $2 to return 200 OK"
    tries=0
    until curl -sL -w '%{http_code}\n' "$2" -o /dev/null | grep -q 200; do
        tries=$tries+1
        if [[ $tries -gt 300 ]]; then
            echo "wait-for-healthy($1): Took longer than 1 minute to be healthy."
            echo "wait-for-healthy($1): Waiting stopped."
            return 1
        fi
        sleep 0.2
    done
    echo "wait-for-healthy($1): Done."
}

function check_environment {
    command -v docker >/dev/null ||
        {
            echo "ERROR: 'docker' command not not found" 1>&2
            exit 1
        }

    if [[ -z $USE_DOCKER ]]; then
        echo 'INFO: $USE_CONTAINER is not set. Running test from host'
        command -v npm >/dev/null ||
            {
                echo "ERROR: 'npm' command not not found" 1>&2
                exit 1
            }
    else
        echo "INFO: \$USE_CONTAINER is set. Running tests with 'docker exec'"
    fi
}

check_environment $@
dir="$(cd "$(printf '%s' "${BASH_SOURCE[0]%/*}")" && pwd)"
rootdir="$dir/.."
clientdir="$dir/../client"
composedir="$clientdir/src/e2etests"

pushd "$dir" >/dev/null
# Use this file for docker-compose commands
export COMPOSE_FILE=docker-compose.prod.yml

# Build binary using outside of docker, set LEGACY=1
if ! [[ -z $LEGACY ]]; then
    # NOTE: Build embedded in docker build
    pushd "$rootdir" >/dev/null

    if [ ! -f "$rootdir/build/ratel" ]; then
        echo "Ratel binary not found. Starting full build. Tested path: \"$rootdir/build/ratel\""
        ./scripts/build.prod.sh
    fi
fi

# Run Ratel and Dgraph
pushd "$composedir" >/dev/null
set -e
# TODO: remove the following two calls to `docker-compose down`
docker-compose down
docker-compose -p ratel_test down
docker-compose up --force-recreate --remove-orphans --detach
sleep 5
set +e
popd >/dev/null

# Verifying that the docker containers are up and running
docker ps
ratelport="$(docker container port e2etests_ratel_1 8000 | cut -d: -f2)"
alphaport="$(docker container port e2etests_alpha_1 8080 | cut -d: -f2)"

wait-for-healthy "Alpha" "localhost:$alphaport/health"
wait-for-healthy "Ratel" "localhost:$ratelport"

# Run tests
pushd "$clientdir" >/dev/null
if [[ -z $USE_DOCKER ]]; then
    echo "INFO: TEST_DGRAPH_SERVER=\"http://localhost:$alphaport\""
    echo "INFO: TEST_RATEL_URL=\"http://localhost:$ratelport?local\""
    echo "INFO: Running tests with 'npm test'"

    # Workaround: Use ?local to run production Ratel builds for e2e tests
    TEST_DGRAPH_SERVER="http://localhost:$alphaport" TEST_RATEL_URL="http://localhost:$ratelport?local" \
        npm test -- --runInBand --testTimeout 40000 --watchAll=false
else
    echo "INFO: Running tests with 'docker exec'"
    docker exec -t e2etests_test_1 npm test -- --runInBand --testTimeout 40000 --watchAll=false
fi
testresults="$?"
popd >/dev/null

# Cleanup
pushd "$composedir" >/dev/null
if [ $testresults != 0 ]; then
    docker-compose logs
fi
docker-compose down && docker-compose rm -f
popd >/dev/null
popd >/dev/null

exit $testresults

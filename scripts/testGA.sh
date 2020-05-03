#!/bin/bash

# Run Dgraph cluster and prod-build of Ratel to run Ratel tests
# (including end-to-end tests).
# The script returns with exit-code 0 if the tests pass, and non-zero
# exit code if the tests fail.
# You must have Puppeteer installed locally for these tests to run.
# "npm test" runs on the local machine.

function wait_for_healthy() {
    echo "wait_for_healthy: Waiting for $1 to return 200 OK"
    tries=0
    until curl -sL -w "%{http_code}\\n" "$1" -o /dev/null | grep -q 200; do
        tries=$tries+1
        if [[ $tries -gt 300 ]]; then
            echo "wait_for_healthy: Took longer than 1 minute to be healthy."
            echo "wait_for_healthy: Waiting stopped."
            return 1
        fi
        sleep 0.2
    done
    echo "wait_for_healthy: Done."
}

dir="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )" && pwd )"
rootdir="$dir/.."
clientdir="$dir/../client"
composedir="$clientdir/src/e2etests"

cd "$rootdir"

# Run Ratel and Dgraph
wait_for_healthy localhost:8080/health
wait_for_healthy localhost:8000

# Run tests
pushd "$clientdir" > /dev/null
# Workaround: Use ?local to run production Ratel builds for e2e tests
TEST_DGRAPH_SERVER="http://localhost:8080" TEST_RATEL_URL="http://localhost:8000?local" npm test -- --runInBand --testTimeout 40000
testresults="$?"
popd > /dev/null

exit $testresults

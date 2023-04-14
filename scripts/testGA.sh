#!/bin/bash

# Run Dgraph cluster and prod-build of Ratel to run Ratel tests
# (including end-to-end tests).
# The script returns with exit-code 0 if the tests pass, and non-zero
# exit code if the tests fail.
# You must have Puppeteer installed locally for these tests to run.
# "npm test" runs on the local machine.

# Function to wait for a URL to return 200 OK
wait_for_healthy() {
    local url=$1
    echo "Waiting for $url to return 200 OK"
    local tries=0

    until curl -sL -w "%{http_code}\\n" "$url" -o /dev/null | grep -q 200; do
        tries=$((tries + 1))
        if [[ $tries -gt 300 ]]; then
            echo "Took longer than 1 minute to be healthy. Waiting stopped."
            return 1
        fi
        sleep 0.2
    done
    echo "Done waiting for $url."
}

# Determine script and project directories
script_dir="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )" && pwd )"
root_dir="$script_dir/.."
client_dir="$root_dir/client"
compose_dir="$client_dir/src/e2etests"

cd "$root_dir"

# Wait for Ratel and Dgraph to be healthy
wait_for_healthy "localhost:8080/health"
wait_for_healthy "localhost:8000"

# Run tests
pushd "$client_dir" > /dev/null
TEST_DGRAPH_SERVER="http://localhost:8080" TEST_RATEL_URL="http://localhost:8000?local" npm test -- --runInBand --testTimeout 40000
test_results="$?"
popd > /dev/null

# Exit with test results status code
exit $test_results

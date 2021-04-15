#!/bin/bash


# The script returns with exit-code 0 if the tests pass, and non-zero
# exit code if the tests fail.
# You must have Puppeteer installed locally for these tests to run.

# You should run yarn start (or NPM) and then run Dgraph cluster
# e.g.  dgraph zero --my=localhost:5080 and 
# dgraph alpha --my=localhost:8080 --zero=localhost:5080 \
# --acl_secret_file=/Users/$myUser/Documents//GitHub/ratel/client/src/e2etests/acl-secret.txt

function wait-for-healthy() {
    printf 'wait-for-healthy: Waiting for %s to return 200 OK\n' "$1"
    tries=0
    until curl -sL -w "%{http_code}\\n" "$1" -o /dev/null | grep -q 200; do
        tries=$tries+1
        if [[ $tries -gt 300 ]]; then
            printf "wait-for-healthy: Took longer than 1 minute to be healthy.\n"
            printf "wait-for-healthy: Waiting stopped.\n"
            return 1
        fi
        sleep 0.2
    done
    printf "wait-for-healthy: Done.\n"
}

dir="$( cd "$( printf '%s' "${BASH_SOURCE[0]%/*}" )" && pwd )"
rootdir="$dir/.."
clientdir="$dir/../client"


pushd "$dir" > /dev/null

  wait-for-healthy 0.0.0.0:8080/health
  wait-for-healthy 0.0.0.0:3000

  # Run tests
  pushd "$clientdir" > /dev/null
    TEST_DGRAPH_SERVER="http://0.0.0.0:8080" TEST_RATEL_URL="http://localhost:3000" \
      yarn test --runInBand --testTimeout 40000 --watchAll=false
    testresults="$?"
  popd > /dev/null

popd > /dev/null

exit $testresults

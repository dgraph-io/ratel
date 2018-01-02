#!/bin/bash

set -e

PREV="$( pwd )"

cd "$( dirname "${BASH_SOURCE[0]}" )"
source ./functions.sh

# cd to the root folder.
cd ..

buildClient false
buildServer false "local"

echo
echo "DONE"

cd $PREV

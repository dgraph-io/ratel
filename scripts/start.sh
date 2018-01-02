#!/bin/bash

set -e

PREV="$( pwd )"

cd "$( dirname "${BASH_SOURCE[0]}" )"
source ./functions.sh

# cd to the root folder.
cd ..

startClient

echo
echo "DONE"

cd $PREV

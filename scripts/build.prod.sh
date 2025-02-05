#!/bin/bash

set -e

dir="$(cd "$(printf '%s' "${BASH_SOURCE[0]%/*}")" && pwd)"
rootDir=$(git rev-parse --show-toplevel)

# cd to the scripts directory
pushd "$dir" >/dev/null
# setting metadata and flags
version="$(grep -i '"version"' <"$rootDir/client/package.json" | awk -F '"' '{print $4}')"
flagUploadToS3=false
buildClientFiles=false
buildServerBinary=false
commitID="$(git rev-parse --short HEAD)"
commitINFO="$(git show --pretty=format:"%h  %ad  %d" | head -n1)"

while [ "$1" != "" ]; do
    case $1 in
    -v | --version)
        shift
        version=$1
        ;;
    -u | --upload)
        flagUploadToS3=true
        ;;

    -c | --client)
        buildClientFiles=true
        ;;

    -s | --server)
        buildServerBinary=true
        ;;
    esac

    shift
done

# including functions to build client and server
source ./functions.sh
popd >/dev/null

# cd to the root folder.
pushd "$rootDir" >/dev/null

# no flag provided build all
if [ $buildClientFiles = false ] && [ $buildServerBinary = false ]; then
    buildClientFiles=true
    buildServerBinary=true
fi

if [ $buildClientFiles = true ]; then
    # build client - production flag set to true
    buildClient true
fi

if [ $buildServerBinary = true ]; then
    # build server - passing along the production flag and version
    buildServer true "$version"
fi

# uploading to s3 when the flagUploadToS3 flag set to true
if [ $flagUploadToS3 = true ]; then
    uploadToS3
fi
popd >/dev/null

printf "\nDONE\n"

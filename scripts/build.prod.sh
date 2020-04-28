#!/bin/bash

set -e

dir="$( dirname "${BASH_SOURCE[0]}" )"
rootdir="$dir/.."

# cd to the scripts directory
pushd "$dir" > /dev/null
    # setting metadata and flags
    version="$(grep -i '"version"' < "$rootdir/client/package.json" | awk -F '"' '{print $4}')"
    flagUploadToS3=false
    commitID="$(git rev-parse --short HEAD)"
    commitINFO="$(git show --pretty=format:"%h  %ad  %d" | head -n1)"

    while [ "$1" != "" ]; do
        case $1 in
            -v | --version )    shift
                                version=$1
                                ;;
            -u | --upload )     flagUploadToS3=true
                                ;;
        esac

        shift
    done

popd > /dev/null

# cd to the root folder.
pushd "$rootdir" > /dev/null
    # build client - production flag set to true
    buildClient true

    # build server - passing along the production flag and version
    buildServer true "$version"

    # uploading to s3 when the flagUploadToS3 flag set to true
    if [ $flagUploadToS3 = true ]; then
        uploadToS3
    fi
popd > /dev/null

printf "\nDONE\n"

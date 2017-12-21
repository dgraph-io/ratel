#!/usr/bin/env sh

set -e

flagUploadToS3=false

while [ "$1" != "" ]; do
    case $1 in
        -u | --upload ) flagUploadToS3=true
                        ;;
    esac

    shift
done

PREV="$( pwd )"

cd "$( dirname "${BASH_SOURCE[0]}" )"
source ./functions.sh

# cd to the root folder.
cd ..

buildClient
buildServer

if [ flagUploadToS3 = true ]; then
    uploadToS3
fi

cd $PREV

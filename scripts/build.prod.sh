#!/bin/bash

set -e

version=""
flagUploadToS3=false

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

PREV="$( pwd )"

cd "$( dirname "${BASH_SOURCE[0]}" )"
source ./functions.sh

# cd to the root folder.
cd ..

buildClient true
buildServer true $version

if [ $flagUploadToS3 = true ]; then
    uploadToS3
fi

echo
echo "DONE"

cd $PREV

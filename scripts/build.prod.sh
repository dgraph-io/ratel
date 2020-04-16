#!/bin/bash

set -e

version="$(cat ../client/package.json | grep -i "version*" | awk -F '"' '{print $4}')" 
flagUploadToS3=false
lastCommitSHA1=$(git rev-parse --short HEAD)
gitBranch=$(git rev-parse --abbrev-ref HEAD)
lastCommitTime=$(git log -1 --format=%ci)

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

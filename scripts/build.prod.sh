#!/bin/bash

set -e

rootDir=$(git rev-parse --show-toplevel)
version="$(cat $rootDir/client/package.json | grep -i "version*" | awk -F '"' '{print $4}')" 
flagUploadToS3=false
commitID="$(git rev-parse --short HEAD)"
commitINFO="$(git show --pretty=format:"%h  %ad  %d" | head -n1)"
skip=false

while [ "$1" != "" ]; do
    case $1 in
        -v | --version )    shift
                            version=$1
                            ;;
        -u | --upload )     flagUploadToS3=true
                            ;;
        -s | --skip )     skip=true
                            ;;
    esac

    shift
done

PREV="$( pwd )"

cd "$( dirname "${BASH_SOURCE[0]}" )"
source ./functions.sh

# cd to the root folder.
cd ..

    if [ $skip != "true" ]; then
    echo " run build "
        buildClient true
    else
        echo ""
    fi

buildServer true $version

if [ $flagUploadToS3 = true ]; then
    uploadToS3
fi

echo
echo "DONE"

cd $PREV

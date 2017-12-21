#!/usr/bin/env sh

set -e

flagProd=false
flagUploadToS3=false

while [ "$1" != "" ]; do
    case $1 in
        -p | --prod )   flagProd=true
                        ;;
        -u | --upload ) flagUploadToS3=true
                        ;;
    esac

    shift
done

if [ $flagProd = false ]; then
    flagUploadToS3=false
fi

PREV="$( pwd )"

cd "$( dirname "${BASH_SOURCE[0]}" )"
source ./functions.sh

# cd to the root folder.
cd ..

buildClient $flagProd
buildServer

if [ $flagUploadToS3 = true ]; then
    uploadToS3
fi

echo
echo "DONE"

cd $PREV

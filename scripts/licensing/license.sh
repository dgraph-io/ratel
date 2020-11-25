#!/bin/bash

tmpfile="$(mktemp)"
dir="$(dirname "$0")"
rateldir="$dir/../.."
files="$(find $rateldir -type f -not -path "*/client/node_modules/*" -name "*.js" -o -name "*.go" ! -name "bindata.go")"

for f in $files
do
    sed -i -E '/\/\/ Copyright 2017-2021 Dgraph Labs, Inc. and Contributors/,/\/\/ limitations under the License\./d' $f
    cat "$dir/header.txt" $f > $tmpfile
    cp $tmpfile $f

    year=$(git log --format=%aD $f | tail -1 | awk '{ print $4 }')
    if [ "$year" != "2019" ]; then
        sed -i "s/Copyright 2017-2021 Dgraph/Copyright $year-2019 Dgraph/g" $f
    fi

    echo $f
done
rm $tmpfile

#!/bin/bash

tmpfile="$(mktemp)"
dir="$(dirname "$0")"
rateldir="$dir/../.."
files="$(find $rateldir -type f -name "*.js" -o -name "*.go" ! -name "bindata.go")"

for f in $files
do
    cat "$dir/header.txt" $f > $tmpfile
    cp $tmpfile $f

    year=$(git log --format=%aD $f | tail -1 | awk '{ print $4 }')
    if [ "$year" != "2018" ]; then
        sed -i "s/Copyright 2018 Dgraph/Copyright $year-2018 Dgraph/g" $f
    fi

    echo $f
done
rm $tmpfile

#!/bin/bash

set -e

# Upload to s3
aws s3 cp --recursive ./client/build/static s3://dgraph-io-ratel/static

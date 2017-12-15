#!/bin/bash

set -e

# Upload to s3
aws s3 cp --recursive ./ui/build/static s3://dgraph-io-hedgehog/static

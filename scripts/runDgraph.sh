#!/bin/bash

set -e

cd scripts
dgraph zero & sleep 2 & \
dgraph alpha --acl_secret_file=./acl-secret.txt & \
../build/ratel

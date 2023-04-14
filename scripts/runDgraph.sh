#!/bin/bash

set -e

# Set the script directory
script_dir=$(dirname "$0")

# Change to the script directory
cd "$script_dir"

# Create a random secret for ACL
head -c 1024 /dev/random > ./data/acl-secret.txt

# Start Dgraph Zero
dgraph zero &
# Wait for 2 seconds to allow Zero to initialize
sleep 2

# Start Dgraph Alpha with the generated ACL secret file
dgraph alpha --acl_secret_file=./data/acl-secret.txt &

# Start Ratel using the build in the parent directory
../build/ratel

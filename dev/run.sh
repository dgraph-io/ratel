#!/bin/bash

set -e

# Fix files for Windows. Converting the files to unix type.
# This is necessary if you are developing from Windows and will be working in a Linux container.
# Because the file type is not compatible with Linux if it is on a Windows disk.
# find ./* -type d \( -path *node_modules/* -o -path ./.git -o -path */3rdpartystatic/* \) -prune -o -name '*.js*' -print0 | xargs -0 dos2unix
# find ./* -type d \( -path *node_modules/* -o -path ./.git -o -path */3rdpartystatic/* \) -prune -o -name '*.sh*' -print0 | xargs -0 dos2unix

cd ./client

# npm ci, not npm install: install ignores the lockfile and resolves newer
# minors than CI builds with, which currently breaks the webpack build. It also
# leaves package-lock.json modified, which is easy to commit by accident.
npm ci --legacy-peer-deps

npm run start

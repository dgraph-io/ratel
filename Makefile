#
# Copyright 2020 Dgraph Labs, Inc. and Contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

BUILD          ?= $(shell git rev-parse --short HEAD)
BUILD_CODENAME  = unnamed
BUILD_DATE     ?= $(shell git log -1 --format=%ci)
BUILD_BRANCH   ?= $(shell git rev-parse --abbrev-ref HEAD)
BUILD_VERSION  ?= $(shell git describe --always --tags)

MODIFIED = $(shell git diff-index --quiet HEAD || echo "-mod")

.PHONY: version test build latest release push help

version:
	@echo Ratel ${BUILD_VERSION}
	@echo Build: ${BUILD}
	@echo Codename: ${BUILD_CODENAME}${MODIFIED}
	@echo Build date: ${BUILD_DATE}
	@echo Branch: ${BUILD_BRANCH}
	# requires GNU grep
	@echo Go version: $(shell printf "go-%s" `grep -oP '(?<=golang:)[^-]*' Dockerfile`)

test:
	@echo Running Tests
	@scripts/test.sh

build:
	@docker build -f Dockerfile -t dgraph/ratel:$(subst /,-,${BUILD_BRANCH}) .

latest:
	@docker tag dgraph/ratel:$(subst /,-,${BUILD_BRANCH}) dgraph/ratel:latest

release: push tag_latest
	@docker push dgraph/ratel:latest .

push:
	@docker push dgraph/ratel:$(subst /,-,${BUILD_BRANCH}) .

help:
	@echo
	@echo Build commands:
	@echo "  make build     - Build docker image"
	@echo "  make test      - Runs tests"
	@echo "  make push      - Push Docker Image with the current version tag to Docker Hub"
	@echo "  make latest    - Tag the current Docker image as 'latest'"
	@echo "  make release   - Push Docker image with the current version and 'latest' tags"
	@echo "  make help      - This help"
	@echo

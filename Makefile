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

BUILD_VERSION  ?= $(shell git describe --always --tags)
BUILD_COMMMIT_ID ?= $(shell git rev-parse --short HEAD)
BUILD_COMMMIT_INFO ?= $(shell git show --pretty=format:"%h  %ad  %d" | head -n1)

.PHONY: version test build latest release push help

version:
	@echo Ratel ${BUILD_VERSION}
	@echo Commit ID: ${BUILD_COMMMIT_ID}
	@echo Commit Info: "${BUILD_COMMMIT_INFO}"
# requires GNU grep (BSD Grep will not work)
	@echo Go version: $(shell printf "go-%s" `grep -oP '(?<=golang:)[^-]*' Dockerfile`)

test:
	@echo Running Tests
	@scripts/test.sh

build:
	@docker build --file Dockerfile  \
		--build-arg commitID=${BUILD_COMMMIT_ID} \
		--build-arg commitINFO="${BUILD_COMMMIT_INFO}" \
		--build-arg version=${BUILD_VERSION} \
		--tag dgraph/ratel:${BUILD_VERSION} .

latest: build
	@docker tag dgraph/ratel:${BUILD_VERSION} dgraph/ratel:latest

release: push latest
	@docker push dgraph/ratel:latest

push:
	@docker push dgraph/ratel:${BUILD_VERSION}

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

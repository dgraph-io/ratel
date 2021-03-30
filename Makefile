RATEL_COMMIT_ID   ?= $(shell git rev-parse --short HEAD)
RATEL_COMMIT_INFO ?= $(shell git show --pretty=format:"%h  %ad  %d" HEAD | head -n1)

.PHONY: image
image: guard-RATEL_IMAGE
	docker build \
		--build-arg RATEL_COMMIT_ID="$(RATEL_COMMIT_ID)" \
		--build-arg RATEL_COMMIT_INFO="$(RATEL_COMMIT_INFO)" \
		-t $(RATEL_IMAGE):$(RATEL_IMAGE_TAG) \
		.

.PHONY: docker-run
docker-run: guard-RATEL_IMAGE
	docker run -it -p 8000:8000 $(RATEL_IMAGE)

.PHONY: docker-push
docker-push: guard-RATEL_IMAGE
	docker push $(RATEL_IMAGE)

.PHONY: test
test:
	./scripts/test.sh

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

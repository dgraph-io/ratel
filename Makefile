RATEL_COMMIT_ID   ?= $(shell git rev-parse --short HEAD)
RATEL_COMMIT_INFO ?= $(git show --pretty=format:"%h  %ad  %d" $(RATEL_COMMIT_ID) | head -n1)

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

.PHONY: build
build: guard-RATEL_IMAGE
	docker build --build-arg RATEL_COMMIT_ID --build-arg RATEL_COMMIT_INFO -t $(RATEL_IMAGE):latest .

.PHONY: run
run: guard-RATEL_IMAGE
	docker run -it -p 8000:8000 $(RATEL_IMAGE)

.PHONY: push
push: guard-RATEL_IMAGE
	docker push $(RATEL_IMAGE)

.PHONY: test
test:
	./scripts/test.sh

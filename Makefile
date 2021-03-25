ifndef RATEL_IMAGE
$(error RATEL_IMAGE is not set)
endif

RATEL_COMMIT_ID   ?= $(shell git rev-parse --short HEAD)
RATEL_COMMIT_INFO ?= $(git show --pretty=format:"%h  %ad  %d" $(RATEL_COMMIT_ID) | head -n1)

.PHONY: build
build:
	docker build --build-arg RATEL_COMMIT_ID --build-arg RATEL_COMMIT_INFO -t $(RATEL_IMAGE):latest .

.PHONY: run
run:
	docker run -it -p 8000:8000 $(RATEL_IMAGE)

.PHONY: push
push:
	docker push $(RATEL_IMAGE)

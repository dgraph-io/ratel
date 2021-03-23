ifndef RATEL_IMAGE
$(error RATEL_IMAGE is not set)
endif

.PHONY: build
build:
	docker build -t $(RATEL_IMAGE):latest .

.PHONY: run
run:
	docker run -it -p 8000:8000 $(RATEL_IMAGE)

.PHONY: push
push:
	docker push $(RATEL_IMAGE)

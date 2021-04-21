.PHONY: thingspro-demo-image

ARCH		?= amd64
REVISION	:= 1
DOCKERFILE	:= Dockerfile.$(ARCH)

thingspro-demo-image:
	docker build \
		-f $(DOCKERFILE) \
		-t thingspro-demo:$(ARCH)-$(REVISION) \
		.
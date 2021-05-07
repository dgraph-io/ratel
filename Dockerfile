# Build Client
FROM node:14-alpine as client

RUN apk update && apk --no-cache --virtual build-dependencies add make git bash python3 gcc g++
ADD . /ratel

WORKDIR /ratel
RUN scripts/build.prod.sh --client

# Build Server
FROM golang:1.16-alpine as server

RUN apk update && apk add git bash
ADD . /ratel

WORKDIR /ratel
COPY --from=client /ratel/server/bindata.go server/bindata.go
RUN ./scripts/build.prod.sh --server


# Final Image
FROM alpine:latest

RUN apk add --no-cache ca-certificates && mkdir /ratel
COPY --from=server /ratel/build/ratel /ratel/server
EXPOSE 8000

ENTRYPOINT exec /ratel/server

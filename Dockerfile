######
# Build Client
####################
FROM node:14.17.0-alpine as client

RUN apk update && apk --no-cache --virtual build-dependencies add make git bash python3 gcc g++

# build package manifest layer
RUN mkdir -p /ratel/client
WORKDIR /ratel/client
COPY ./client/package.json /ratel/client
RUN npm install --legacy-peer-deps

# copy all assets and build
COPY . /ratel
RUN npm run build:prod

######
# Build Server
####################
FROM golang:1.16.4-alpine as server

RUN apk update && apk add git bash
COPY . /ratel

WORKDIR /ratel
ENV CGO_ENABLED=0
COPY --from=client /ratel/client/build /ratel/client/build
# instal go-bindata
RUN go get -u github.com/go-bindata/go-bindata/...
RUN ./scripts/build.prod.sh --server

######
# Final Image
####################
FROM alpine:latest as final

RUN apk add --no-cache ca-certificates
RUN addgroup -g 1000 dgraph && \
    adduser -u 1000 -G dgraph -s /bin/sh -D dgraph
# copy server artifact w/ embedded client artifact (bindata) to final stage
COPY --from=server /ratel/build/ratel /usr/local/bin/dgraph-ratel
EXPOSE 8000
USER dgraph

CMD ["/usr/local/bin/dgraph-ratel"]

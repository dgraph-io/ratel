######
# Build Client
####################
FROM node:22.16.0-alpine AS client

RUN apk update && apk --no-cache --virtual build-dependencies add make git bash python3 gcc g++

# build package manifest layer
RUN mkdir -p /ratel/client
WORKDIR /ratel/client
COPY ./client/package.json /ratel/client
RUN npm install --legacy-peer-deps --no-optional

# copy all assets and build
COPY . /ratel
RUN npm run build:prod

######
# Build Server
####################
FROM golang:1.23.10-alpine3.22 AS server
ENV PATH="/go/bin:$PATH"


RUN apk add --no-cache git bash
COPY . /ratel

WORKDIR /ratel
ENV CGO_ENABLED=0
COPY --from=client /ratel/client/build /ratel/client/build
# instal go-bindata
RUN go install github.com/go-bindata/go-bindata/...@v3.1.2
RUN ./scripts/build.prod.sh --server

######
# Final Image
####################
FROM alpine:3.22 AS final

RUN apk add --no-cache ca-certificates && \
    addgroup -g 1000 dgraph && \
    adduser -u 1000 -G dgraph -s /bin/sh -D dgraph
# copy server artifact w/ embedded client artifact (bindata) to final stage
COPY --from=server /ratel/build/ratel /usr/local/bin/dgraph-ratel
EXPOSE 8000
USER dgraph

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

CMD ["/usr/local/bin/dgraph-ratel"]

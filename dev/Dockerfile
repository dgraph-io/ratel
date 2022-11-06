FROM node:14.17.0-alpine
LABEL maintainer="Dgraph Labs <contact@dgraph.io>"

RUN apk update && apk --no-cache add \
      make git bash python3 gcc g++ ca-certificates

RUN addgroup -g 1000 dgraph && \
    adduser -u 1000 -G dgraph -s /bin/sh -D dgraph
    mkdir -p /app && \
    chown -R dgraph:dgraph /app

WORKDIR /app

EXPOSE 8000 3000
USER dgraph

CMD /bin/sh

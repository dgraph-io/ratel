FROM node:14.17.0-alpine
LABEL maintainer="Dgraph Labs <contact@dgraph.io>"

RUN apk update && apk --no-cache add \
      make git bash python3 gcc g++ ca-certificates curl

WORKDIR /app

CMD /bin/sh

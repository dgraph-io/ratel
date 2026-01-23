FROM node:14.17.0-alpine
LABEL maintainer="Istari Digital, Inc. <dgraph-admin@istaridigital.com>"

RUN apk update && apk --no-cache add \
      make git bash python3 gcc g++ ca-certificates curl

WORKDIR /app

CMD /bin/sh

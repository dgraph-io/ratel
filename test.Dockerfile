# -*- mode: Dockerfile -*-
# vi: set ft=Dockerfile :
FROM node:14.17.0-alpine as test

# Install chromium
# ref. https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-on-alpine
RUN apk update && \
    apk --no-cache --virtual build-dependencies add \
      make git bash python3 gcc g++ \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Tell Puppeteer to skip installing Chrome.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN npm install puppeteer@8.0.0

COPY . /ratel

RUN addgroup -S dgraph && adduser -S -g dgraph dgraph \
    && mkdir -p /home/dgraph/Downloads /ratel \
    && chown -R dgraph:dgraph /home/dgraph \
    && chown -R dgraph:dgraph /ratel

# build package manifest layer
WORKDIR /ratel/client
USER dgraph
RUN npm install --legacy-peer-deps

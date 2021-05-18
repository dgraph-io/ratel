# -*- mode: Dockerfile -*-
# vi: set ft=Dockerfile :
FROM node:14.17.0-buster as test

# Borrowed from TeamCity Build Task
# ref https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix
RUN apt-get update && \
    apt-get install -y \
      ca-certificates \
      fonts-liberation \
      libappindicator3-1 \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libc6 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libfontconfig1 \
      libgbm1 \
      libgcc1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libstdc++6 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      lsb-release \
      wget \
      xdg-utils

COPY . /ratel
RUN groupadd -r dgraph && \
    useradd -r -g dgraph -G dgraph dgraph && \
    mkdir -p /home/dgraph/Downloads /ratel && \
    chown -R dgraph:dgraph /home/dgraph && \
    chown -R dgraph:dgraph /ratel

# build package manifest layer
WORKDIR /ratel/client
USER dgraph
# install node modules
RUN npm install --legacy-peer-deps

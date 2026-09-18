# Must be an npm that can read package-lock.json's lockfileVersion 3. Node 14
# ships npm 6, which silently ignores a v3 lockfile and resolves fresh from the
# package.json ranges instead — that pulls react-draggable 4.7.x, whose .mjs
# build webpack 5 cannot resolve ("Can't resolve 'process/browser'"), so the
# bundle fails to compile. npm 6 also rewrites the lockfile down to v1 on its
# way past. Kept in step with the client build in the root Dockerfile.
FROM node:22.16.0-alpine
LABEL maintainer="Istari Digital, Inc. <dgraph-admin@istaridigital.com>"

RUN apk update && apk --no-cache add \
      make git bash python3 gcc g++ ca-certificates curl

WORKDIR /app

CMD /bin/sh

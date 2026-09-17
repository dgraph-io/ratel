## End-to-end tests

Run tests with Docker Compose config using prod build of Ratel and locally
installed Puppeteer:

```sh
../../../scripts/test.sh
```

That is what `make test` and CI run. It builds Ratel, brings up Dgraph and a
Ratel container, discovers their mapped ports and runs jest against them.

### Reproducing a CI failure locally

These tests pass on developer hardware and fail on CI far more often than the
reverse, because most failures are races that only lose on a slower machine.
Set `TEST_CPU_THROTTLE` to slow the browser down and reproduce one here:

```sh
TEST_CPU_THROTTLE=4 ../../../scripts/test.sh
```

`4` runs the page at a quarter speed, which is roughly a loaded CI runner. It
is off unless the variable is set.

### Chrome's sandbox

`setupBrowser` passes `--no-sandbox --disable-setuid-sandbox` when `CI` is set,
because Ubuntu 23.10+ restricts the unprivileged user namespaces Chrome's
sandbox needs and the browser will not start without them. Local runs keep the
sandbox enabled. These tests only ever load Ratel on localhost; do not reuse
this setup to load untrusted pages.

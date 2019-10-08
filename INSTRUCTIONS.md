# Building and running ratel

## Local development

```sh
# Build ratel
# Note that ratel needs to be in your GOPATH for this to work. Otherwise,
# main.go will not be able to import the server code correctly.
./scripts/build.prod.sh

# Start the ratel server.
./build/ratel
# Visit localhost:8000 to use ratel.

# If you want client hot-reloading, run:
./scripts/start.sh
# Visit localhost:3000 to use hot-reloaded ratel.
```

## Production build

```sh
./scripts/build.prod.sh
```

## Serving over HTTPS

By default Ratel will serve the UI over HTTP. You can switch to serve the UI with **only** HTTPS by
setting the `-tls_crt` and `-tls_key` flags with the certificate and key files used to establish the
HTTPS connection.

```
./build/ratel -tls_crt example.crt -tls_key example.key
```

### Publishing to AWS S3

Instructions to publish ratel assets (JS and CSS files)
to AWS S3 bucket.

#### Before publishing

- Install the AWS CLI -
  [see docs](https://docs.aws.amazon.com/cli/latest/userguide/installing.html).
- Get access to AWS credentials and configure the AWS CLI -
  [see docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-config-files.html).

#### Publishing

```sh
# Builds the Go server and JS and CSS client files. Also uploads the JS and CSS
# files to AWS S3. Optionally, you can also pass a version as `--version 1.0.0`.
./scripts/build.prod.sh --upload
```

After this you can invalidate the AWS Cloudfront cache
([see docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html))
so that users see the latest code upon refreshing.

# Building and running ratel

## Local development

```sh
# Do a local build.
./scripts/build.local.sh

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

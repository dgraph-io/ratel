# Ratel

Dgraph IDE, available at https://ratel.hypermode.com.

## Building and running

See [Instructions](./INSTRUCTIONS.md).

## License

Apache 2.0. See [LICENSE](./LICENSE).

## Note

We used to run Ratel along with the main Dgraph binary(Core Code). But it has been removed and some
code here has become obsolete. Like the ones in the "Server" directory, some processes in Bash
Script and so on. Now we have created a unique image for Ratel. See
https://hub.docker.com/r/dgraph/ratel

## play.dgraph.io

The UI available at http://play.dgraph.io/ is kept in an S3 Bucket and distributed via CDN.
Communication between the UI, documentation and parts of the Tour uses a shared dataset. Its
configuration is done through the config file in `./server/play-dgraph-io.nginx.conf`.

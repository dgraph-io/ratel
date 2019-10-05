# Ratel

Dgraph Dashboard

## Building and running

See [Instructions](./INSTRUCTIONS.md).

## Serving over HTTPS

By default Ratel will serve the UI over HTTP. You can switch to serve the UI with only HTTPS by setting the `-tls_crt` and `-tls_key` flags with the certificate and key files used to establish the HTTPS connection.

```
dgraph-ratel -tls_crt example.crt -tls_key example.key
```

## License

Dgraph Community License. See [LICENSE](./LICENSE).

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseDgraphUrl } from './helpers'

describe('parseDgraphUrl', () => {
  describe('dgraph:// protocol URLs', () => {
    it('parses simple localhost URL with default sslmode', () => {
      const result = parseDgraphUrl('dgraph://localhost:9080')
      expect(result).toEqual({
        url: 'http://localhost:9080',
        sslmode: 'disable',
        bearertoken: null,
        namespace: null,
      })
    })

    it('parses URL with sslmode=verify-ca', () => {
      const result = parseDgraphUrl(
        'dgraph://dg.example.com:443?sslmode=verify-ca',
      )
      expect(result).toEqual({
        url: 'https://dg.example.com:443',
        sslmode: 'verify-ca',
        bearertoken: null,
        namespace: null,
      })
    })

    it('parses URL with sslmode and bearertoken', () => {
      const result = parseDgraphUrl(
        'dgraph://foo-bar.grpc.dgraph-io.com:443?sslmode=verify-ca&bearertoken=token',
      )
      expect(result).toEqual({
        url: 'https://foo-bar.grpc.dgraph-io.com:443',
        sslmode: 'verify-ca',
        bearertoken: 'token',
        namespace: null,
      })
    })

    it('parses URL with credentials and sslmode', () => {
      const result = parseDgraphUrl(
        'dgraph://sally:supersecret@dg.example.com:443?sslmode=verify-ca',
      )
      expect(result).toEqual({
        url: 'https://sally:supersecret@dg.example.com:443',
        sslmode: 'verify-ca',
        bearertoken: null,
        namespace: null,
      })
    })

    it('parses URL with credentials and namespace', () => {
      const result = parseDgraphUrl(
        'dgraph://sally:supersecret@dg.example.com:443?namespace=2',
      )
      expect(result).toEqual({
        url: 'http://sally:supersecret@dg.example.com:443',
        sslmode: 'disable',
        namespace: '2',
        bearertoken: null,
      })
    })

    it('uses http when sslmode=disable', () => {
      const result = parseDgraphUrl('dgraph://example.com:8080?sslmode=disable')
      expect(result).toEqual({
        url: 'http://example.com:8080',
        sslmode: 'disable',
        bearertoken: null,
        namespace: null,
      })
    })

    it('uses https when sslmode=require', () => {
      const result = parseDgraphUrl('dgraph://example.com:443?sslmode=require')
      expect(result).toEqual({
        url: 'https://example.com:443',
        sslmode: 'require',
        bearertoken: null,
        namespace: null,
      })
    })
  })

  describe('http(s) URLs', () => {
    it('passes through http URL unchanged', () => {
      const result = parseDgraphUrl('http://localhost:8080')
      expect(result).toEqual({
        url: 'http://localhost:8080',
        sslmode: 'verify-ca',
        bearertoken: null,
        namespace: null,
      })
    })

    it('passes through https URL unchanged', () => {
      const result = parseDgraphUrl('https://dgraph.example.com')
      expect(result).toEqual({
        url: 'https://dgraph.example.com',
        sslmode: 'verify-ca',
        bearertoken: null,
        namespace: null,
      })
    })
  })
})

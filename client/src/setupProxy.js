/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    }),
  )
}

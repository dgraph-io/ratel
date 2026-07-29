/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// The project's babel config lives in package.json ("babel"), which is a
// file-relative config and therefore never applies to files inside
// node_modules. This transformer passes the presets explicitly so that the
// ESM-only packages allowed through transformIgnorePatterns (react-leaflet)
// are compiled to CommonJS for Jest.
const babelJest = require('babel-jest')

module.exports = (babelJest.default || babelJest).createTransformer({
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
      },
    ],
    ['@babel/preset-react', { runtime: 'classic' }],
  ],
  plugins: [
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
  ],
  babelrc: false,
  configFile: false,
})

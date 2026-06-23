/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom babel-jest transformer with an explicit config.
//
// The babel config in package.json ("babel" key) is file-relative, so it is
// never applied to files inside node_modules. ESM-only packages allowed
// through transformIgnorePatterns (e.g. react-leaflet) therefore reached the
// test runtime untransformed. This transformer applies the presets to every
// file Jest transforms, regardless of location.
const babelJest = require('babel-jest')

module.exports = babelJest.createTransformer({
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    [
      require.resolve('@babel/plugin-proposal-class-properties'),
      { loose: true },
    ],
  ],
  babelrc: false,
  configFile: false,
})

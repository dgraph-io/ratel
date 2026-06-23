/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Test-only polyfills. jsdom 16 doesn't expose TextEncoder/TextDecoder,
// web streams, Blob or MessageChannel, which newer dependencies
// (e.g. undici via cheerio/enzyme) require. This file is referenced only
// from Jest's setupFiles, never from webpack, so requiring node core
// modules here is safe.

const util = require('util')
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = util.TextDecoder
}

const streamWeb = require('stream/web')
for (const name of [
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'ByteLengthQueuingStrategy',
  'CountQueuingStrategy',
]) {
  if (typeof global[name] === 'undefined' && streamWeb[name]) {
    global[name] = streamWeb[name]
  }
}

const buffer = require('buffer')
if (typeof global.Blob === 'undefined' && buffer.Blob) {
  global.Blob = buffer.Blob
}

const workerThreads = require('worker_threads')
for (const name of ['MessageChannel', 'MessagePort']) {
  if (typeof global[name] === 'undefined' && workerThreads[name]) {
    global[name] = workerThreads[name]
  }
}

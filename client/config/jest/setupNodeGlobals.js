/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// jsdom does not provide these web globals; undici (via cheerio) needs them.
// Node provides native implementations for all of them. This file is only
// referenced from the Jest config — it must not be imported by the webpack
// build, which cannot bundle node builtins.
const util = require('util')
const streamWeb = require('stream/web')
const workerThreads = require('worker_threads')
const buffer = require('buffer')

const nodeGlobals = {
  TextEncoder: util.TextEncoder,
  TextDecoder: util.TextDecoder,
  ReadableStream: streamWeb.ReadableStream,
  WritableStream: streamWeb.WritableStream,
  TransformStream: streamWeb.TransformStream,
  ByteLengthQueuingStrategy: streamWeb.ByteLengthQueuingStrategy,
  CountQueuingStrategy: streamWeb.CountQueuingStrategy,
  MessageChannel: workerThreads.MessageChannel,
  MessagePort: workerThreads.MessagePort,
  Blob: buffer.Blob,
  File: buffer.File,
}

for (const [name, impl] of Object.entries(nodeGlobals)) {
  if (typeof global[name] === 'undefined') {
    global[name] = impl
  }
}

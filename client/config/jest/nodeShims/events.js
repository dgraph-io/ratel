/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Jest 26 can't resolve `node:`-prefixed core modules (used by newer
// dependencies such as cheerio); moduleNameMapper points them here.
module.exports = require('events')

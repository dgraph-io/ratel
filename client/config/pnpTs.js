/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const { resolveModuleName } = require('ts-pnp')

exports.resolveModuleName = (
  typescript,
  moduleName,
  containingFile,
  compilerOptions,
  resolutionHost,
) => {
  return resolveModuleName(
    moduleName,
    containingFile,
    compilerOptions,
    resolutionHost,
    typescript.resolveModuleName,
  )
}

exports.resolveTypeReferenceDirective = (
  typescript,
  moduleName,
  containingFile,
  compilerOptions,
  resolutionHost,
) => {
  return resolveModuleName(
    moduleName,
    containingFile,
    compilerOptions,
    resolutionHost,
    typescript.resolveTypeReferenceDirective,
  )
}

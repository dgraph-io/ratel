/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Stand-in for `sigma`, `sigma/rendering` and `@sigma/edge-curve` under
// Jest: sigma's CJS bundle references WebGL2RenderingContext at module
// load, which doesn't exist in jsdom.
class MockSigma {
  on() {
    return this
  }
  refresh() {}
  kill() {}
  getNodeAttribute() {}
  getEdgeAttribute() {}
  getCustomBBox() {
    return null
  }
  setCustomBBox() {}
  getBBox() {
    return { x: [0, 1], y: [0, 1] }
  }
  viewportToGraph() {
    return { x: 0, y: 0 }
  }
}

class MockProgram {}

module.exports = {
  __esModule: true,
  default: MockSigma,
  Sigma: MockSigma,
  EdgeArrowProgram: MockProgram,
  EdgeCurveProgram: MockProgram,
  EdgeCurvedArrowProgram: MockProgram,
}

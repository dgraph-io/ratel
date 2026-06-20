/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Stand-in for `sigma` (and its subpath exports `sigma/rendering`,
// `sigma/types`, `sigma/settings`, `sigma/utils`) under Jest: sigma v4's
// ESM bundle references WebGL2RenderingContext at module load, which
// doesn't exist in jsdom.

class MockCamera {
  animatedReset() {}
  animate() {}
  on() {
    return this
  }
}

class MockSigma {
  constructor() {
    this.state = new Map()
    this.edgeState = new Map()
    this.graphState = {}
    this.listeners = new Map()
  }

  on(event, fn) {
    const list = this.listeners.get(event) || []
    list.push(fn)
    this.listeners.set(event, list)
    return this
  }

  emit(event, payload) {
    const list = this.listeners.get(event) || []
    list.forEach((fn) => fn(payload))
  }

  refresh() {}
  kill() {}

  getCamera() {
    return new MockCamera()
  }

  getNodeDisplayData(uid) {
    if (!this.graph || !this.graph.hasNode) {
      return undefined
    }
    const attrs = this.graph.getNodeAttributes(uid)
    return { x: attrs.x || 0, y: attrs.y || 0, size: attrs.size || 5 }
  }

  getEdgeDisplayData() {
    return undefined
  }

  getNodeState(uid) {
    return this.state.get(uid) || {}
  }

  setNodeState(uid, patch) {
    const cur = this.state.get(uid) || {}
    this.state.set(uid, { ...cur, ...patch })
    return this
  }

  getEdgeState(key) {
    return this.edgeState.get(key) || {}
  }

  setEdgeState(key, patch) {
    const cur = this.edgeState.get(key) || {}
    this.edgeState.set(key, { ...cur, ...patch })
    return this
  }

  getGraphState() {
    return this.graphState
  }

  setGraphState(patch) {
    this.graphState = { ...this.graphState, ...patch }
    return this
  }
}

const stubProgram = {}

module.exports = {
  __esModule: true,
  default: MockSigma,
  Sigma: MockSigma,
  extremityArrow: stubProgram,
  layerFill: stubProgram,
  layerPlain: stubProgram,
  pathCurved: stubProgram,
  pathLine: stubProgram,
  sdfCircle: stubProgram,
}

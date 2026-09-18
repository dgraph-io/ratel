/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { setTheme } from 'actions/ui'
import reducer from './ui'

describe('ui reducer theme', () => {
  it('defaults the persisted theme setting to system', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.theme).toBe('system')
  })

  it('handles setTheme', () => {
    let state = reducer(undefined, setTheme('dark'))
    expect(state.theme).toBe('dark')

    state = reducer(state, setTheme('light'))
    expect(state.theme).toBe('light')

    state = reducer(state, setTheme('system'))
    expect(state.theme).toBe('system')
  })

  it('does not affect other ui state', () => {
    const initial = reducer(undefined, { type: '@@INIT' })
    const state = reducer(initial, setTheme('dark'))
    expect(state.mainFrameUrl).toBe(initial.mainFrameUrl)
    expect(state.overlayUrl).toBe(initial.overlayUrl)
  })
})

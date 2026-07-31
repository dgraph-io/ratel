/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer'

import {
  CLICK_SIDEBAR_URL,
  SET_PANEL_MINIMIZED,
  SET_PANEL_SIZE,
  SET_THEME,
} from 'actions/ui'
import { THEME_SYSTEM } from 'lib/theme'

const defaultState = {
  width: 100,
  height: 100,

  mainFrameUrl: '',
  overlayUrl: null,

  theme: THEME_SYSTEM,
}

const isMainFrameUrl = (sidebarMenu) =>
  ['', 'acl', 'backups', 'schema', 'cluster', 'connection'].indexOf(
    sidebarMenu,
  ) >= 0

export default (state = defaultState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case SET_PANEL_MINIMIZED:
        draft.panelMinimized = action.minimized
        break

      case SET_PANEL_SIZE:
        draft.panelHeight = action.height
        draft.panelWidth = action.width
        break

      case SET_THEME:
        draft.theme = action.theme
        break

      case CLICK_SIDEBAR_URL:
        const url = action.url
        if (isMainFrameUrl(url)) {
          draft.mainFrameUrl = url
          draft.overlayUrl = null
        } else {
          draft.overlayUrl = draft.overlayUrl === url ? null : url
        }
        break

      default:
        return
    }
  })

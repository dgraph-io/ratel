/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export const SET_PANEL_SIZE = 'ui/SET_PANEL_SIZE'
export const SET_PANEL_MINIMIZED = 'ui/SET_PANEL_MINIMIZED'
export const SET_SHOW_SYSTEM_PREDICATES = 'ui/SET_SHOW_SYSTEM_PREDICATES'

export const CLICK_SIDEBAR_URL = 'mainframe/CLICK_SIDEBAR_URL'

export function clickSidebarUrl(url) {
  return {
    type: CLICK_SIDEBAR_URL,
    url,
  }
}

export function setPanelSize({ width, height }) {
  return {
    type: SET_PANEL_SIZE,
    width,
    height,
  }
}

export function setPanelMinimized(minimized) {
  return {
    type: SET_PANEL_MINIMIZED,
    minimized,
  }
}

// One preference for the whole app: the cluster and schema views both hide
// Dgraph's own predicates, and an operator who wants to see them wants to see
// them everywhere. The ui slice is in the redux-persist whitelist, so the
// choice survives a reload without any storage handling here.
export function setShowSystemPredicates(show) {
  return {
    type: SET_SHOW_SYSTEM_PREDICATES,
    show,
  }
}

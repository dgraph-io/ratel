/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

export const SET_PANEL_SIZE = 'ui/SET_PANEL_SIZE'
export const SET_PANEL_MINIMIZED = 'ui/SET_PANEL_MINIMIZED'

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

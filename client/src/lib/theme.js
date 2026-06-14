/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'
export const THEME_SYSTEM = 'system'

// Order in which the sidebar toggle cycles through theme settings.
export const THEME_CYCLE = [THEME_LIGHT, THEME_DARK, THEME_SYSTEM]

/**
 * Resolves a theme setting ('light' | 'dark' | 'system') to the effective
 * theme ('light' | 'dark'). Unknown or missing settings behave as 'system'.
 */
export function resolveTheme(setting, systemPrefersDark) {
  if (setting === THEME_LIGHT || setting === THEME_DARK) {
    return setting
  }
  return systemPrefersDark ? THEME_DARK : THEME_LIGHT
}

/**
 * Returns the next theme setting in the cycle light -> dark -> system.
 */
export function nextTheme(setting) {
  const index = THEME_CYCLE.indexOf(setting)
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length]
}

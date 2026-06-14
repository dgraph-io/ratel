/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Persistence for per-group graph style rules (Neo4j Bloom-style
// "perspectives"): { [group]: { color?: '#rrggbb', size?: number } }.

const STORAGE_KEY = 'ratel-graph-style-rules'

export const MIN_NODE_SIZE = 4
export const MAX_NODE_SIZE = 20

export function sanitizeRule(rule) {
  if (!rule || typeof rule !== 'object') {
    return null
  }
  const out = {}
  if (typeof rule.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(rule.color)) {
    out.color = rule.color.toLowerCase()
  }
  const size = Number(rule.size)
  if (Number.isFinite(size)) {
    out.size = Math.min(MAX_NODE_SIZE, Math.max(MIN_NODE_SIZE, size))
  }
  return Object.keys(out).length ? out : null
}

export function sanitizeRules(rules) {
  if (!rules || typeof rules !== 'object') {
    return {}
  }
  const out = {}
  Object.keys(rules).forEach((group) => {
    const rule = sanitizeRule(rules[group])
    if (rule) {
      out[group] = rule
    }
  })
  return out
}

export function loadStyleRules(storage = window.localStorage) {
  try {
    return sanitizeRules(JSON.parse(storage.getItem(STORAGE_KEY)))
  } catch {
    return {}
  }
}

export function saveStyleRules(rules, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeRules(rules)))
  } catch {
    // Storage full or unavailable - styling is cosmetic, ignore.
  }
}

// Merges a single field change into the rule set, dropping empty rules.
export function updateRule(rules, group, change) {
  const next = { ...rules }
  const merged = sanitizeRule({ ...next[group], ...change })
  if (merged) {
    next[group] = merged
  } else {
    delete next[group]
  }
  return next
}

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TAB_JSON } from 'actions/frames'

export const SNIPPET_MAX_LENGTH = 60

/**
 * formatLatencyMs renders a latency expressed in nanoseconds as a short
 * millisecond string, e.g. 1234567 -> "1.2ms". Returns '' when the value
 * is missing or not a positive number.
 */
export function formatLatencyMs(latencyNs) {
  if (typeof latencyNs !== 'number' || !isFinite(latencyNs) || latencyNs <= 0) {
    return ''
  }
  const ms = latencyNs / 1e6
  if (ms < 1) {
    return `${ms.toFixed(2)}ms`
  }
  if (ms < 10) {
    return `${ms.toFixed(1)}ms`
  }
  return `${Math.round(ms)}ms`
}

// Collapses all whitespace runs (including newlines) into single spaces
// and truncates to SNIPPET_MAX_LENGTH characters, appending an ellipsis.
function makeSnippet(query) {
  const oneLine = String(query || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (oneLine.length <= SNIPPET_MAX_LENGTH) {
    return oneLine
  }
  return `${oneLine.slice(0, SNIPPET_MAX_LENGTH)}…`
}

// Picks the most relevant tab result for a frame: the JSON tab when it has
// completed (mutations and JSON queries land there), otherwise any other
// completed tab (e.g. a query only executed on the visual tab).
function pickTabResult(frameResult) {
  if (!frameResult) {
    return null
  }
  const jsonResult = frameResult[TAB_JSON]
  if (jsonResult && jsonResult.completed) {
    return jsonResult
  }
  const completed = Object.values(frameResult).find(
    (tabResult) => tabResult && tabResult.completed,
  )
  return completed || null
}

/**
 * summarizeFrame computes display info for one history row.
 *
 * @param frame - a frames.items entry ({ id, action, query, ... })
 * @param frameResults - the frames.frameResults map keyed by frame id,
 *   holding per-tab results ({ completed, error, serverLatencyNs, ... })
 * @returns {{status: 'ok'|'error'|'unknown', latencyText: string, snippet: string}}
 */
export function summarizeFrame(frame, frameResults) {
  const snippet = makeSnippet(frame && frame.query)
  const frameResult = frame && frameResults ? frameResults[frame.id] : undefined
  const tabResult = pickTabResult(frameResult)

  if (!tabResult) {
    return { status: 'unknown', latencyText: '', snippet }
  }
  return {
    status: tabResult.error ? 'error' : 'ok',
    latencyText: formatLatencyMs(tabResult.serverLatencyNs),
    snippet,
  }
}

/**
 * filterFrames returns the frames whose query text contains the search
 * string (case-insensitive). A blank search returns all frames.
 */
export function filterFrames(items, query) {
  const frames = items || []
  const needle = String(query || '')
    .trim()
    .toLowerCase()
  if (!needle) {
    return frames
  }
  return frames.filter(
    (frame) =>
      typeof frame?.query === 'string' &&
      frame.query.toLowerCase().includes(needle),
  )
}

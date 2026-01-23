/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

function getTextColor(bgColor) {
  const nThreshold = 105
  const components = getRGBComponents(bgColor)
  const bgDelta =
    components.R * 0.299 + components.G * 0.587 + components.B * 0.114

  return 255 - bgDelta < nThreshold ? '#000000' : '#ffffff'
}

function getRGBComponents(color) {
  const r = color.substring(1, 3)
  const g = color.substring(3, 5)
  const b = color.substring(5, 7)

  return {
    R: parseInt(r, 16),
    G: parseInt(g, 16),
    B: parseInt(b, 16),
  }
}

export default ({ color, pred, label, ...domProps }) => (
  <div
    className='label-container'
    style={{
      backgroundColor: color,
      color: getTextColor(color),
    }}
    {...domProps}
  >
    <span className='label-value'>{pred}</span>
  </div>
)

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import ProgressBar from 'react-bootstrap/ProgressBar'

import '../assets/css/Graph.scss'

export default function Progress({ perc }) {
  return (
    <ProgressBar
      className='Graph-progress'
      active={true}
      now={perc}
      min={0}
      max={100}
      label={`${perc}%`}
    />
  )
}

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import loader from '../assets/images/loader.svg'

export default function FrameLoading() {
  return (
    <div className='loading-outer'>
      <div>
        <img src={loader} alt='Loading Indicator' className='spinner' />
        <div className='text'>Fetching result...</div>
      </div>
    </div>
  )
}

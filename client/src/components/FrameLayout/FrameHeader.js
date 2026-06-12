/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import { useDispatch } from 'react-redux'

import { discardFrame, setActiveFrame } from 'actions/frames'
import { updateQueryAndAction, updateQueryVars } from 'actions/query'
import { latencyBarSegments, latencyTooltip, timeToText } from 'lib/latency'

import QueryPreview from './QueryPreview'
import SharingSettings from './SharingSettings'
import './FrameHeader.scss'

export default function FrameHeader({
  collapsed,
  frame,
  tabResult,
  isActive,
  isFullscreen,
  onToggleFullscreen,
}) {
  const dispatch = useDispatch()
  const selectFrame = () => {
    dispatch(updateQueryAndAction(frame.query, frame.action))
    if (frame.action === 'query') {
      dispatch(updateQueryVars(frame.queryOptions?.queryVars || []))
    }
    dispatch(setActiveFrame(frame.id))
  }

  function drawLatency(result) {
    if (!result) {
      return null
    }
    const segments = latencyBarSegments(
      result.serverLatency,
      result.networkLatencyNs,
    )
    if (!segments.length) {
      return null
    }

    const serverNs = result.serverLatencyNs || 0
    const totalNs = segments.reduce((sum, s) => sum + s.ns, 0)

    return (
      <div
        className='timing-outer'
        title={latencyTooltip(segments)}
        onClick={selectFrame}
      >
        <div className='progress'>
          {segments.map((s) => (
            <div
              key={s.key}
              className={`latency-seg latency-seg--${s.key.replace(/_ns$/, '')}`}
              style={{ flexGrow: Math.max(1, 1000 * s.ratio) }}
            />
          ))}
        </div>
        <div className='text-wrapper'>
          <div className='server-text'>
            {serverNs > 0 ? timeToText(serverNs) : timeToText(totalNs)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={classnames('frame-header', {
        active: isActive,
      })}
    >
      {frame.query ? (
        <QueryPreview
          frameId={frame.id}
          query={frame.query}
          action={frame.action}
          hasError={frame.hasError}
          onClick={selectFrame}
        />
      ) : null}

      {drawLatency(tabResult)}

      <div className='actions'>
        {collapsed ? null : (
          <>
            <DropdownButton
              className='dropdown-share action'
              title={<i className='fa fa-share' />}
            >
              <Dropdown.Item as={SharingSettings} query={frame.query} />
            </DropdownButton>

            <button
              className='action btn btn-link'
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <i className='fa fa-compress' />
              ) : (
                <i className='fa fa-expand' />
              )}
            </button>
          </>
        )}

        {!isFullscreen ? (
          <button
            className='action btn btn-link'
            onClick={() => dispatch(discardFrame(frame.id))}
          >
            <i className='fas fa-trash-alt' />
          </button>
        ) : null}
      </div>
    </div>
  )
}

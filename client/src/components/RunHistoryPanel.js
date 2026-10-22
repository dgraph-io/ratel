/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import TimeAgo from 'react-timeago'

import { setActiveFrame } from 'actions/frames'
import { updateQueryAndAction, updateQueryVars } from 'actions/query'
import { filterFrames, summarizeFrame } from 'lib/runHistory'

import './RunHistoryPanel.scss'

const STATUS_TITLES = {
  ok: 'Completed without errors',
  error: 'Completed with errors',
  unknown: 'Not executed in this session',
}

export default function RunHistoryPanel() {
  const dispatch = useDispatch()
  const { items, frameResults, activeFrameId } = useSelector(
    (store) => store.frames,
  )

  const [isOpen, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [coords, setCoords] = React.useState(null)

  const rootRef = React.useRef(null)
  const buttonRef = React.useRef(null)
  const searchRef = React.useRef(null)

  // Position the panel below the button, right-aligned to it, but clamped
  // to the viewport so a narrow editor pane never pushes it off-screen
  // (it is position:fixed, so it also escapes any clipping ancestor).
  const PANEL_WIDTH = 420
  const computeCoords = () => {
    if (!buttonRef.current) {
      return
    }
    const rect = buttonRef.current.getBoundingClientRect()
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 16)
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8),
    )
    setCoords({ top: rect.bottom + 2, left, width })
  }

  const toggleOpen = () => {
    if (isOpen) {
      setOpen(false)
    } else {
      computeCoords()
      setOpen(true)
    }
  }

  // Close the panel on outside clicks and on Escape; keep it anchored to
  // the button on resize.
  React.useEffect(() => {
    if (!isOpen) {
      return
    }
    const onMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', computeCoords)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', computeCoords)
    }
  }, [isOpen])

  // Focus the search input when the panel opens.
  React.useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const selectFrame = (frame) => {
    dispatch(updateQueryAndAction(frame.query, frame.action))
    if (frame.action === 'query') {
      dispatch(updateQueryVars(frame.queryOptions?.queryVars || []))
    }
    dispatch(setActiveFrame(frame.id))
    setOpen(false)
  }

  const visibleFrames = filterFrames(items, search)

  const renderRow = (frame) => {
    const { status, latencyText, snippet } = summarizeFrame(frame, frameResults)
    const createdAt = frame.createdAt || frame.timestamp

    return (
      <button
        key={frame.id}
        type='button'
        className={classnames('run-history-row', {
          active: frame.id === activeFrameId,
        })}
        onClick={() => selectFrame(frame)}
        title={frame.query}
      >
        <i
          className={classnames('action-icon', {
            'fa fa-search': frame.action === 'query',
            'far fa-edit': frame.action !== 'query',
          })}
        />
        <span
          className={`status-dot status-${status}`}
          title={STATUS_TITLES[status]}
        />
        <span className='snippet'>{snippet}</span>
        <span className='meta'>
          {latencyText && <span className='latency'>{latencyText}</span>}
          {createdAt && (
            <span className='time'>
              <TimeAgo date={createdAt} minPeriod={10} />
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <div className='run-history' ref={rootRef}>
      <button
        ref={buttonRef}
        type='button'
        className={classnames('action actionable', { open: isOpen })}
        onClick={toggleOpen}
        title='Show run history'
      >
        <i className='fa fa-history' /> History
      </button>

      {isOpen && coords && (
        <div
          className='run-history-panel'
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width,
          }}
        >
          <div className='run-history-search'>
            <input
              ref={searchRef}
              type='text'
              className='form-control form-control-sm'
              placeholder='Search past queries...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className='run-history-list'>
            {visibleFrames.length ? (
              visibleFrames.map(renderRow)
            ) : (
              <div className='run-history-empty text-muted'>
                {items.length
                  ? 'No runs match your search'
                  : 'No queries have been run yet'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

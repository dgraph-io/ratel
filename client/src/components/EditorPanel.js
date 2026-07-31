/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import { useDispatch, useSelector } from 'react-redux'

import { runQuery } from 'actions/frames'
import {
  updateAction,
  updateBestEffort,
  updateQuery,
  updateQueryVars,
  updateReadOnly,
} from 'actions/query'

import QueryBuilder from 'components/QueryBuilder'
import QueryVarsEditor from 'components/QueryVarsEditor'
import Editor from 'containers/Editor'

import '../assets/css/EditorPanel.scss'

function looksLikeBuilderDql(text) {
  return /\bquery\s+[A-Za-z_][A-Za-z0-9_]*/i.test(String(text || ''))
}

export default function EditorPanel() {
  const dispatch = useDispatch()
  const { action, query, queryVars, bestEffort, readOnly } = useSelector(
    (state) => state.query,
  )
  const [mode, setMode] = useState(action === 'mutate' ? 'mutate' : 'query')
  const builderRef = useRef(null)
  const importTimerRef = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(importTimerRef.current)
    },
    [],
  )

  const setReadOnly = (value) => dispatch(updateReadOnly(value))
  const setBestEffort = (value) => dispatch(updateBestEffort(value))

  const onClearQuery = () => {
    if (mode === 'builder') {
      builderRef.current?.clear?.()
      return
    }
    dispatch(updateQuery(''))
    dispatch(updateQueryVars([]))
  }

  const onUpdateQuery = (next) => {
    dispatch(updateQuery(next))
    if (mode !== 'builder') {
      return
    }
    // Debounce canvas updates so incomplete typing doesn't thrash / fail-parse,
    // and so a successful re-parse doesn't rewrite the editor mid-keystroke.
    clearTimeout(importTimerRef.current)
    importTimerRef.current = setTimeout(() => {
      const text = String(next || '').trim()
      if (!text) {
        builderRef.current?.clear?.()
        return
      }
      if (looksLikeBuilderDql(text)) {
        builderRef.current?.importQuery?.(next)
      }
    }, 400)
  }

  const selectMode = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'mutate') {
      dispatch(updateAction('mutate'))
    } else {
      dispatch(updateAction('query'))
    }
  }

  const onRunCurrentQuery = () => {
    if (mode === 'builder') {
      // Flush any pending editor→canvas sync before running.
      clearTimeout(importTimerRef.current)
      if (looksLikeBuilderDql(query)) {
        builderRef.current?.importQuery?.(query)
      }
      builderRef.current?.run?.()
      return
    }
    dispatch(
      runQuery(query, action, {
        bestEffort,
        readOnly,
        queryVars: action === 'query' ? queryVars : undefined,
      }),
    )
  }

  const renderModeBtn = (id, title) => (
    <button
      className='action actionable'
      onClick={() => selectMode(id)}
      type='button'
    >
      <label className='editor-label'>
        <input
          className='editor-type'
          type='radio'
          name='editor-mode'
          value={id}
          checked={mode === id}
          onChange={() => selectMode(id)}
        />
        &nbsp;
        {title}
      </label>
    </button>
  )

  const isQueryDirty = query.trim() !== ''
  const hasQueryVars = mode !== 'mutate' && queryVars?.length

  const queryOptions = mode !== 'mutate' && (
    <DropdownButton
      id='query-sliders-dropdown'
      className='action actionable'
      title={<i className='fas fa-sliders-h' />}
    >
      <Dropdown.Item onClick={() => setReadOnly(!readOnly)}>
        <input type='checkbox' checked={readOnly} readOnly /> Read Only
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => setBestEffort(!bestEffort)}
        disabled={!readOnly}
      >
        <input type='checkbox' checked={bestEffort} readOnly /> Best Effort
      </Dropdown.Item>
    </DropdownButton>
  )

  return (
    <div
      className={classnames('editor-panel', {
        'editor-panel-builder': mode === 'builder',
      })}
    >
      <div className='header'>
        <div className='actions'>
          {renderModeBtn('query', 'Query')}
          {renderModeBtn('mutate', 'Mutate')}
          {renderModeBtn('builder', 'Builder')}
        </div>

        {queryOptions}

        <div className='actions right'>
          <button
            type='button'
            className={classnames('action', {
              actionable: isQueryDirty || hasQueryVars,
            })}
            onClick={() => onClearQuery()}
          >
            <i className='fa fa-times' /> Clear
          </button>
          <button
            type='button'
            className={classnames('action', {
              actionable: isQueryDirty,
            })}
            onClick={() => {
              if (mode !== 'builder' && query === '') {
                return
              }
              onRunCurrentQuery()
            }}
          >
            <i className='fa fa-play' /> Run
          </button>
        </div>
      </div>

      {mode === 'builder' ? (
        <div className='builder-console-layout'>
          <div className='builder-canvas-pane'>
            <QueryBuilder ref={builderRef} embedded />
          </div>
          <div className='builder-query-pane'>
            <div className='builder-query-label'>Generated DQL</div>
            <Editor
              onUpdateQuery={onUpdateQuery}
              onHotkeyRun={onRunCurrentQuery}
              query={query}
              maxHeight='fillParent'
            />
            <QueryVarsEditor />
          </div>
        </div>
      ) : (
        <>
          <Editor
            onUpdateQuery={onUpdateQuery}
            onHotkeyRun={onRunCurrentQuery}
            query={query}
            maxHeight='fillParent'
          />
          {mode === 'query' && <QueryVarsEditor />}
        </>
      )}
    </div>
  )
}

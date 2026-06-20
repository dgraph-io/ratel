/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { addTab, closeTab, renameTab, switchTab } from 'actions/query'

import './EditorTabs.scss'

export default function EditorTabs() {
  const dispatch = useDispatch()
  const { tabs = [], activeTabId } = useSelector((state) => state.query)
  const [editingId, setEditingId] = useState(null)
  const [draftName, setDraftName] = useState('')
  const renameInputRef = useRef(null)

  useEffect(() => {
    if (editingId !== null && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [editingId])

  const startRename = (tab) => {
    setEditingId(tab.id)
    setDraftName(tab.name)
  }

  const commitRename = () => {
    if (editingId !== null) {
      dispatch(renameTab(editingId, draftName))
      setEditingId(null)
    }
  }

  const onInputKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      commitRename()
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className='editor-tabs' role='tablist'>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role='tab'
          aria-selected={tab.id === activeTabId}
          tabIndex={0}
          className={classnames('editor-tab', {
            active: tab.id === activeTabId,
          })}
          onClick={() => dispatch(switchTab(tab.id))}
          onDoubleClick={() => startRename(tab)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              dispatch(switchTab(tab.id))
            }
          }}
        >
          {editingId === tab.id ? (
            <input
              ref={renameInputRef}
              className='editor-tab-rename-input'
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={onInputKeyDown}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className='editor-tab-name' title={tab.name}>
              {tab.name}
            </span>
          )}
          {tabs.length > 1 && (
            <button
              type='button'
              className='editor-tab-close'
              title='Close tab'
              onClick={(e) => {
                e.stopPropagation()
                dispatch(closeTab(tab.id))
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type='button'
        className='editor-tab-add'
        title='New tab'
        onClick={() => dispatch(addTab())}
      >
        +
      </button>
    </div>
  )
}

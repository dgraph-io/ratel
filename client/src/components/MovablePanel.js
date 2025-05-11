/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React from 'react'
import Draggable from 'react-draggable'

const COLLAPSED_HEIGHT = 28

const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 360

const MIN_WIDTH = 150
const MIN_HEIGHT = 150

const MIN_GAP_WIDTH = 5
const MIN_GAP_HEIGHT = 5

export default function MovablePanel({
  boundingSelector,
  children,
  collapsed,
  minimized,
  title,
  width,
  height,
  onResize,
  onSetPanelMinimized,
}) {
  width = width || DEFAULT_WIDTH
  height = height || DEFAULT_HEIGHT

  height = collapsed
    ? COLLAPSED_HEIGHT
    : minimized
      ? COLLAPSED_HEIGHT
      : Math.max(MIN_HEIGHT, height)

  const getAndUpdateBoundSize = (width, height) => {
    const el = document.querySelector(boundingSelector)
    const maxW = !el ? 2000 : el.clientWidth - MIN_GAP_WIDTH
    const maxH = !el ? 1000 : el.clientHeight - MIN_GAP_HEIGHT

    const boundSize = {
      width: Math.max(MIN_WIDTH, Math.min(width, maxW)),
      height: Math.max(MIN_HEIGHT, Math.min(height, maxH)),
    }
    if (
      !collapsed &&
      !minimized &&
      (boundSize.width !== width || boundSize.height !== height)
    ) {
      window.setTimeout(() => onResize(boundSize), 0)
    }
    return boundSize
  }

  const _onDrag = (e) =>
    onResize(getAndUpdateBoundSize(width - e.movementX, height - e.movementY))

  getAndUpdateBoundSize(width, height)

  return (
    <div
      className={classnames('graph-overlay', { collapsed })}
      style={{ width, height }}
    >
      <div className='title' title={title}>
        {collapsed || minimized ? null : (
          <Draggable
            onDrag={_onDrag}
            bounds='.graph-container'
            position={{ x: 0, y: 0 }}
          >
            <div className='panel-btn'>
              <i className='fas fa-arrows-alt' />
            </div>
          </Draggable>
        )}
        {!collapsed && !minimized ? (
          <div className='panel-btn' onClick={() => onSetPanelMinimized(true)}>
            <i className='far fa-window-minimize' />
          </div>
        ) : null}
        {!collapsed && minimized ? (
          <div className='panel-btn' onClick={() => onSetPanelMinimized(false)}>
            <i className='far fa-window-restore' />
          </div>
        ) : null}
        {title}
      </div>
      {children}
    </div>
  )
}

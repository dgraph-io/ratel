/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import screenfull from 'screenfull'

import {
  TAB_GEO,
  TAB_JSON,
  TAB_QUERY,
  TAB_VISUAL,
  setResultsTab,
} from 'actions/frames'
import GeoView from 'components/ConsolePage/GeoView'
import FrameCodeTab from './FrameCodeTab'
import FrameBodyToolbar from './FrameLayout/FrameBodyToolbar'
import FrameErrorMessage from './FrameLayout/FrameErrorMessage'
import FrameHeader from './FrameLayout/FrameHeader'
import FrameHistoric from './FrameLayout/FrameHistoric'
import FrameMessage from './FrameLayout/FrameMessage'
import FrameSession from './FrameLayout/FrameSession'
import FrameLoading from './FrameLoading'

export default function FrameItem({
  activeFrameId,
  collapsed,
  frame,
  tabResult,
}) {
  const [isFullscreen, setFullscreen] = React.useState(screenfull.isFullscreen)

  const dispatch = useDispatch()
  const activeTab = useSelector((store) => store.frames.tab)
  const setActiveTab = (tab) => dispatch(setResultsTab(tab))

  const frameRef = React.createRef()

  React.useEffect(() => {
    const callback = () => setFullscreen(screenfull.isFullscreen)
    document.addEventListener(screenfull.raw.fullscreenchange, callback)

    return () =>
      document.removeEventListener(screenfull.raw.fullscreenchange, callback)
  })

  const handleToggleFullscreen = () => {
    if (!screenfull.enabled) {
      return
    }

    if (isFullscreen) {
      screenfull.exit()
      setFullscreen(false)
    } else {
      screenfull.request(frameRef.current)
      setFullscreen(true)
    }
  }

  const renderContent = () => {
    if (activeTab === TAB_QUERY) {
      return <FrameCodeTab code={frame.query} />
    }
    if (!tabResult.completed) {
      if (!tabResult.canExecute && !tabResult.executionStart) {
        return <FrameHistoric />
      } else {
        return <FrameLoading />
      }
    }
    switch (activeTab) {
      case TAB_VISUAL:
        if (frame.action !== 'query') {
          return <FrameMessage frame={frame} tabResult={tabResult} />
        }
        return frame.action === 'query' && !tabResult.error ? (
          <FrameSession frame={frame} tabResult={tabResult} />
        ) : (
          <FrameErrorMessage error={tabResult.error} />
        )

      case TAB_GEO:
        return <GeoView results={tabResult} />

      case TAB_JSON:
      default:
        return <FrameCodeTab code={tabResult.response || tabResult.error} />
    }
  }

  const renderFrameBody = () => (
    <div className='body'>
      <FrameBodyToolbar
        activeTab={activeTab}
        frame={frame}
        setActiveTab={setActiveTab}
        tabResult={tabResult}
      />
      {renderContent()}
    </div>
  )

  return (
    <li
      className={classnames('frame-item', {
        fullscreen: isFullscreen,
        collapsed,
        'h-100': true,
      })}
      ref={frameRef}
    >
      <FrameHeader
        frame={frame}
        isActive={activeFrameId === frame.id}
        isFullscreen={isFullscreen}
        collapsed={collapsed}
        onToggleFullscreen={handleToggleFullscreen}
      />
      {!collapsed ? renderFrameBody() : null}
    </li>
  )
}

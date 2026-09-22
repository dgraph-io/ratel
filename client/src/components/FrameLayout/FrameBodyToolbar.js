/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'

import { TAB_GEO, TAB_JSON, TAB_QUERY, TAB_VISUAL } from 'actions/frames'
import GraphIcon from 'components/GraphIcon'
import { downloadCSV } from 'lib/csvExport'

const ACTION_DOWNLOAD_CSV = 'download-csv'

const getCsvFilename = () => {
  const pad = (value) => String(value).padStart(2, '0')
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}-${pad(now.getHours())}${pad(now.getMinutes())}`
  return `ratel-results-${timestamp}.csv`
}

export default function FrameBodyToolbar({
  frame,
  activeTab,
  setActiveTab,
  tabResult,
}) {
  const isQueryFrame = frame.action === 'query'
  const isError =
    tabResult.error || (tabResult.response && tabResult.response.error)

  const onSelectTab = (tab) => {
    if (tab === ACTION_DOWNLOAD_CSV) {
      downloadCSV(tabResult.response.data, getCsvFilename())
      return
    }
    setActiveTab(tab)
  }

  const toolbarBtn = (id, icon, label) => (
    <Tab
      eventKey={id}
      title={
        <span>
          <div className='icon-container'>{icon}</div>
          <span className='menu-label'>{label}</span>
        </span>
      }
    />
  )

  const visualTab = () => {
    if (isQueryFrame && !isError) {
      return toolbarBtn(TAB_VISUAL, <GraphIcon />, 'Graph')
    }
    if (isError) {
      return toolbarBtn(
        TAB_VISUAL,
        <i className='icon fas fa-exclamation-triangle' />,
        'Error',
      )
    }
    return toolbarBtn(
      TAB_VISUAL,
      <i className='icon fa fa-check-circle' />,
      'Message',
    )
  }

  const downloadCsvTab = () => {
    if (!isQueryFrame || !tabResult.response?.data) {
      return null
    }
    return toolbarBtn(
      ACTION_DOWNLOAD_CSV,
      <i className='icon fas fa-download' />,
      'Download CSV',
    )
  }

  return (
    <Tabs
      className='toolbar'
      id='frame-tabs'
      activeKey={activeTab}
      onSelect={onSelectTab}
    >
      {visualTab()}
      {toolbarBtn(TAB_JSON, <i className='icon fa fa-code' />, 'JSON')}
      {toolbarBtn(TAB_QUERY, <i className='icon fas fa-terminal' />, 'Request')}
      {toolbarBtn(TAB_GEO, <i className='icon fas fa-globe-americas' />, 'Geo')}
      {downloadCsvTab()}
    </Tabs>
  )
}

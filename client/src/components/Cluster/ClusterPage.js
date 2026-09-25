/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment'
import React, { useEffect, useState } from 'react'
import Card from 'react-bootstrap/Card'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import { useDispatch, useSelector } from 'react-redux'
import useInterval from 'use-interval'

import { getClusterState, getInstanceHealth } from 'actions/cluster'
import ColorGenerator from 'lib/ColorGenerator'
import { humanizeBytes } from 'lib/helpers'
import { isSystemTablet } from 'lib/predicates'
import { getSpace } from 'lib/utils'
import SystemPredicateToggle from '../SystemPredicateToggle'
import MoveTabletModal from './MoveTabletModal'
import RemoveNodeModal from './RemoveNodeModal'

import './ClusterPage.scss'

const SYSTEM_PREDICATE_HINT =
  'Managed by Dgraph — cannot be moved between groups or dropped.'

export default function ClusterPage() {
  const dispatch = useDispatch()
  const { instanceHealth, isAuthorized, clusterState } = useSelector(
    (state) => state.cluster,
  )

  const currentServer = useSelector(
    (state) => state.connection.serverHistory[0],
  )

  const [removeNodeState, setRemoveNodeState] = useState(undefined)
  const [moveTabletState, setMoveTabletState] = useState(undefined)
  // Shared with the schema view and remembered across reloads, so an operator
  // who wants Dgraph's own predicates in view has to say so once.
  const showSystemPredicates = useSelector(
    (state) => state.ui.showSystemPredicates,
  )

  const refresh = () => {
    dispatch(getInstanceHealth())
    dispatch(getClusterState())
  }

  useInterval(refresh, 10000)
  useEffect(refresh, [currentServer, dispatch])

  if (!isAuthorized) {
    return (
      <div className='alert alert-danger' style={{ margin: '20px 40px' }}>
        You need to login as a <strong>guardians group</strong> member to view
        Cluster State.
      </div>
    )
  }

  const getHealthDot = (addr) => {
    const health = (instanceHealth || []).find((r) => r.address === addr)

    if (!health) {
      return <div className='health unknown' />
    }

    const humanizeLastEcho = () => {
      if (!health.lastEcho) {
        return ''
      }
      const lastPing = health.lastEcho * 1000 - Date.now()
      return ` - last echo ${moment.duration(lastPing).humanize(true)}`
    }

    return (
      <div
        className={
          health.status === 'healthy' ? 'health healthy' : 'health dead'
        }
        title={`${health.status}${humanizeLastEcho()}`}
      />
    )
  }

  const Node = ({ node }) => {
    const R = ({ children, other }) => (
      <div className='node'>
        {getHealthDot(node.addr)}
        <div className='id' title={`Id: ${node.id}`}>
          {node.id} -
        </div>
        <span className='addr' title={node.addr}>
          {node.addr}
        </span>
        {node.leader && (
          <div className='leader-wrap'>
            <div className='leader' title='Leader' />
          </div>
        )}
        {children}
      </div>
    )

    if (!node.groupId) {
      // This is a zero
      return <R />
    }

    return (
      <DropdownButton as={R} key={node.id} title=''>
        <Dropdown.Item href='#' onClick={() => onRemoveNode(node)}>
          Remove Node
        </Dropdown.Item>
      </DropdownButton>
    )
  }

  const renderNode = (node) => <Node node={node} key={node.id} />

  const onRemoveNode = (node) => {
    setRemoveNodeState({
      nodeId: node.id,
      groupId: node.groupId,
    })
  }

  const renderZeros = (zeros) => {
    if (!zeros) {
      return
    }

    const license = clusterState?.license || {}
    const expiryTs = license.expiryTs ?? null
    const remainingMs = expiryTs ? expiryTs * 1000 - Date.now() : null

    return (
      <div className='zeros'>
        <div className='summary-panel'>
          <h1>Zeros ({Object.values(zeros).length})</h1>
          {license && Object.keys(license).length > 0 && (
            <div className='license'>
              <span className='value'>
                {license.enabled ? 'Enterprise License' : 'Community Edition'}
              </span>
              <br />
              Max Nodes:{' '}
              <span className='value'>
                {license.maxNodes > 1e10 ? '∞' : license.maxNodes}
              </span>
              <br />
              {remainingMs > 0 ? 'Expires' : 'Expired'}:{' '}
              <span className='value'>
                {moment.duration(remainingMs, 'ms').humanize(true)}
              </span>
            </div>
          )}
        </div>
        <div className='nodes'>{Object.values(zeros).map(renderNode)}</div>
      </div>
    )
  }

  const renderGroups = (groups) => {
    if (!groups) {
      return
    }

    const colors = new ColorGenerator()

    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

    const compareTablets = (a, b) => {
      if (!getSpace(a[1]) && !getSpace(b[1])) {
        return cmp(a[0], b[0])
      }
      if (getSpace(a[1]) && !getSpace(b[1])) {
        return -1
      }
      if (getSpace(b[1]) && !getSpace(a[1])) {
        return 1
      }
      const cmpSpace = -cmp(
        parseFloat(getSpace(a[1])),
        parseFloat(getSpace(b[1])),
      )
      return cmpSpace || cmp(a[0], b[0])
    }

    const renderSpace = (space) => {
      if (!space) {
        return <span className='space default'>&lt; 64MB</span>
      }

      return <span className='space'>{humanizeBytes(space)}</span>
    }

    // Dgraph will not move or drop its own predicates, so they cannot be acted
    // on here and would otherwise outnumber the real ones — a cluster with no
    // user data still lists seven, or thirteen with ACL enabled. They stay
    // reachable behind a toggle rather than being hidden outright, because they
    // do occupy disk and take part in the raft write pipeline.
    const renderTablet = (groupKey, [p, tablet], isSystem) => (
      <div className={isSystem ? 'tablet system' : 'tablet'} key={p}>
        <span>{p}</span>
        {isSystem ? (
          <span className='system-tag' title={SYSTEM_PREDICATE_HINT}>
            system
          </span>
        ) : (
          Object.keys(clusterState?.groups || {}).length > 1 && (
            <button
              className='move'
              title='Move to another group'
              onClick={() =>
                setMoveTabletState({
                  fromGroup: groupKey,
                  tablet: p,
                })
              }
            >
              <i className='fas fa-exchange-alt' />
            </button>
          )
        )}
        {renderSpace(getSpace(tablet))}
      </div>
    )

    const renderSystemTablets = (key, systemTablets) => {
      if (!systemTablets.length || !showSystemPredicates) {
        return null
      }

      return (
        <>
          <div className='tablets'>
            {systemTablets.map((entry) => renderTablet(key, entry, true))}
          </div>
          <p className='system-hint'>{SYSTEM_PREDICATE_HINT}</p>
        </>
      )
    }

    const renderGroup = (key, g) => {
      const tablets = Object.entries(g.tablets || {})
      const systemTablets = tablets.filter(([p]) => isSystemTablet(p))
      const userTablets = tablets.filter(([p]) => !isSystemTablet(p))
      userTablets.sort(compareTablets)
      systemTablets.sort(compareTablets)

      // The heading describes the list under it, so it follows the preference
      // — otherwise the count reads as wrong while the system rows are shown.
      const shownTablets = showSystemPredicates
        ? tablets.length
        : userTablets.length

      return (
        <div
          className='group'
          key={key}
          style={{
            backgroundColor: `rgba(${colors.getRGBA(0.25).join(',')})`,
          }}
        >
          <h1 title={`Group #${key}`}>Group #{key}</h1>
          <div className='nodes'>
            {Object.values(g.members || {}).map(renderNode)}
          </div>
          <h1>Tablets ({shownTablets})</h1>
          {/* One scroll region per group. Without it a group with a few
              hundred predicates grows to whatever height it likes, and since
              .groups is a stretch flex row, it drags every sibling group to
              that height with it — leaving the others mostly empty space. */}
          <div className='tablet-list'>
            <div className='tablets'>
              {userTablets.map((entry) => renderTablet(key, entry, false))}
            </div>
            {renderSystemTablets(key, systemTablets)}
          </div>
        </div>
      )
    }

    // Counted across every group, because the control governs all of them.
    const systemTabletCount = Object.values(groups).reduce(
      (acc, g) =>
        acc + Object.keys(g.tablets || {}).filter(isSystemTablet).length,
      0,
    )

    return (
      <>
        <div className='groups-heading'>
          <h1>Groups ({Object.entries(groups).length})</h1>
          <SystemPredicateToggle count={systemTabletCount} />
        </div>

        <div className='groups'>
          {Object.entries(groups).map(([key, g]) => renderGroup(key, g))}
        </div>
      </>
    )
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Cluster Management</Card.Title>
        {renderZeros(clusterState?.zeros)}
        {renderGroups(clusterState?.groups)}
      </Card.Body>
      {removeNodeState && (
        <RemoveNodeModal
          {...removeNodeState}
          onHide={() => {
            setRemoveNodeState()
            refresh()
          }}
        />
      )}

      {moveTabletState && (
        <MoveTabletModal
          {...moveTabletState}
          groups={clusterState?.groups}
          onHide={() => {
            setMoveTabletState()
            refresh()
          }}
        />
      )}
    </Card>
  )
}

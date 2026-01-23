/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import CSSTransition from 'react-transition-group/CSSTransition'
import TransitionGroup from 'react-transition-group/TransitionGroup'

import SessionItem from './SessionItem'

import '../assets/css/SessionList.scss'

export default function SessionList({ sessions }) {
  return (
    <ul className='session-list'>
      <TransitionGroup>
        {sessions.map((session) => {
          return (
            <CSSTransition
              key={session.id}
              classNames='session-item'
              timeout={{ enter: 800, exit: 300 }}
            >
              <SessionItem session={session} />
            </CSSTransition>
          )
        })}
      </TransitionGroup>
    </ul>
  )
}

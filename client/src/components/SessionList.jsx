/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import TransitionGroup from "react-transition-group/TransitionGroup"
import CSSTransition from "react-transition-group/CSSTransition"

import SessionItem from "./SessionItem"

import "../assets/css/SessionList.scss"

export default function SessionList({ sessions }) {
    return (
        <ul className="session-list">
            <TransitionGroup>
                {sessions.map((session) => {
                    return (
                        <CSSTransition
                            key={session.id}
                            classNames="session-item"
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

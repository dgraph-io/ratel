// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import TransitionGroup from "react-transition-group/TransitionGroup";
import CSSTransition from "react-transition-group/CSSTransition";

import SessionItem from "./SessionItem";

import "../assets/css/SessionList.scss";

export default function SessionList({ sessions }) {
    return (
        <ul className="session-list">
            <TransitionGroup>
                {sessions.map(session => {
                    return (
                        <CSSTransition
                            key={session.id}
                            classNames="session-item"
                            timeout={{ enter: 800, exit: 300 }}
                        >
                            <SessionItem session={session} />
                        </CSSTransition>
                    );
                })}
            </TransitionGroup>
        </ul>
    );
}

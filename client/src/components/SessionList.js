// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

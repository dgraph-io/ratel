import React from "react";
import SessionItem from "./SessionItem";
import TransitionGroup from "react-transition-group/TransitionGroup";
import CSSTransition from "react-transition-group/CSSTransition";

import "../assets/css/SessionList.scss";

const SessionList = ({ sessions }) => {
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
};

export default SessionList;

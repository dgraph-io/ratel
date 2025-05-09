/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import classnames from "classnames"

import VerticalPanelLayout from "./VerticalPanelLayout"
import HorizontalPanelLayout from "./HorizontalPanelLayout"

import "./PanelLayout.scss"

export default class PanelLayout extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isVertical: !!this.props.disableHorizontal,
        }
        this.onSetVertical(this.state.isVertical)

        this.actualPanels = React.createRef()
    }

    onSetVertical = (isVertical) => this.props.onSetVertical && this.props.onSetVertical(isVertical)

    setVertical = (isVertical) => {
        this.setState({ isVertical })
        this.onSetVertical(isVertical)
    }

    render() {
        const { disableHorizontal, first, second, title } = this.props
        const { isVertical } = this.state

        return (
            <div
                className={classnames("panel-layout", {
                    cols: isVertical,
                    rows: !isVertical,
                })}
            >
                {!title ? null : <h2>{title}</h2>}
                {disableHorizontal ? null : (
                    <div className="toolbar">
                        <button
                            className={isVertical ? "active" : ""}
                            onClick={() => this.setVertical(true)}
                        >
                            <i className="fas fa-columns" />
                        </button>
                        <button
                            className={!isVertical ? "active" : ""}
                            onClick={() => this.setVertical(false)}
                        >
                            <i className="fas fa-columns fa-rotate-270" />
                        </button>
                    </div>
                )}
                {isVertical ? (
                    <VerticalPanelLayout first={first} second={second} />
                ) : (
                    <HorizontalPanelLayout first={first} second={second} />
                )}
            </div>
        )
    }
}

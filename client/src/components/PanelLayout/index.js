// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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
import classnames from "classnames";

import VerticalPanelLayout from "./VerticalPanelLayout";
import HorizontalPanelLayout from "./HorizontalPanelLayout";

import "./PanelLayout.scss";

export default class PanelLayout extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isVertical: !!this.props.disableHorizontal,
        };
        this.onSetVertical(this.state.isVertical);

        this.actualPanels = React.createRef();
    }

    onSetVertical = isVertical =>
        this.props.onSetVertical && this.props.onSetVertical(isVertical);

    setVertical = isVertical => {
        this.setState({ isVertical });
        this.onSetVertical(isVertical);
    };

    render() {
        const { disableHorizontal, first, second, title } = this.props;
        const { isVertical } = this.state;

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
        );
    }
}

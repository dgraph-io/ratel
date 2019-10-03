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
import Draggable from "react-draggable";

import "./VerticalPanelLayout.scss";

export default class VerticalPanelLayout extends React.Component {
    state = {
        position: null,
        width: -1,
        height: -1,
    };

    body = React.createRef();
    second = React.createRef();

    componentDidMount() {
        window.addEventListener("resize", this._onResize);
        this._onResize();
    }

    componentDidUpdate() {
        this._onResize();
    }

    _onResize = () => {
        const { offsetWidth, offsetHeight } = this.body.current;
        // Only setState when dimensions actually changed to avoid infinite loop
        if (
            offsetWidth !== this.state.width ||
            offsetHeight !== this.state.height
        ) {
            setTimeout(
                () =>
                    this.setState(
                        {
                            height: offsetHeight,
                            width: offsetWidth,
                        },
                        this.props.onAfterResize,
                    ),
                0,
            );
        }
    };

    componentWillUnmount() {
        window.removeEventListener("resize", this._onResize);
    }

    _handleDrag = (e, ui) => {
        this.setState(
            {
                position: this.state.position + ui.deltaX,
            },
            this.props.onAfterResize,
        );
    };

    _handleDragStart = (e, ui) => {
        this.setState(
            {
                separatorPosition: this.state.position,
            },
            this.props.onAfterResize,
        );
    };

    _handleDragStop = (e, ui) => {
        this.setState(
            {
                separatorPosition: null,
            },
            this.props.onAfterResize,
        );
    };

    getPanelStyles() {
        const { width, position } = this.state;
        if (width <= 0) {
            return {};
        }

        let pos =
            position === null
                ? (this.props.defaultRatio || 0.382) * width
                : position;
        if (pos >= width - 50) {
            pos = Math.max(width / 2, width - 50);
        }

        if (pos < 50) {
            pos = Math.min(width / 2, 50);
        }

        pos = Math.round(pos);
        if (pos !== position) {
            setTimeout(() => this.setState({ position: pos }), 0);
        }

        return {
            first: {
                width: `${pos}px`,
            },
            second: {
                flex: 1,
            },
            separator: {
                left: `${this.state.separatorPosition || pos}px`,
            },
        };
    }

    render() {
        const { first, second } = this.props;

        const styles = this.getPanelStyles();

        return (
            <div className="vertical-panel-layout" ref={this.body}>
                <div className="panel first" style={styles.first}>
                    {first}
                </div>

                <Draggable
                    axis="x"
                    bound="parent"
                    onDrag={this._handleDrag}
                    onStart={this._handleDragStart}
                    onStop={this._handleDragStop}
                    position={{ x: 0, y: 0 }}
                >
                    <div className="separator" style={styles.separator} />
                </Draggable>

                <div
                    className="panel second"
                    ref={this.second}
                    style={styles.second}
                >
                    {second}
                </div>
            </div>
        );
    }
}

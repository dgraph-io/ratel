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

export default class HorizontalPanelLayout extends React.Component {
    state = {
        width: -1,
        height: -1,
    };

    body = React.createRef();
    second = React.createRef();

    componentDidMount() {
        window.addEventListener("resize", this._onResize);
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
                    this.setState({
                        height: offsetHeight,
                        width: offsetWidth,
                    }),
                0,
            );
        }
    };

    componentWillUnmount() {
        window.removeEventListener("resize", this._onResize);
    }

    render() {
        const { first, second } = this.props;

        return (
            <div className="horizontal-panel-layout" ref={this.body}>
                <div className="panel first">{first}</div>

                <div className="panel second" ref={this.second}>
                    {second}
                </div>
            </div>
        );
    }
}

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
import ReactDataGrid from "react-data-grid";

export default class AutosizeGrid extends React.Component {
    state = {
        width: 100,
        height: 100,
    };

    outerRef = React.createRef();
    dataGrid = React.createRef();

    componentDidMount() {
        const checkResize = () => {
            if (this.outerRef.current) {
                const height = this.outerRef.current.offsetHeight;
                const width = this.outerRef.current.offsetWidth;
                if (
                    width !== this.state.width ||
                    height !== this.state.height
                ) {
                    this.setState(
                        {
                            height,
                            width,
                        },
                        () => this.dataGrid.current.metricsUpdated(),
                    );
                }
            }
        };
        setTimeout(checkResize, 1);
        this.resizeInterval = setInterval(checkResize, 500);
    }

    componentWillUnmount() {
        clearInterval(this.resizeInterval);
    }

    render() {
        const { className, style, ...otherProps } = this.props;
        return (
            <div className={className} style={style} ref={this.outerRef}>
                <ReactDataGrid
                    ref={this.dataGrid}
                    minHeight={this.state.height}
                    {...otherProps}
                />
            </div>
        );
    }
}

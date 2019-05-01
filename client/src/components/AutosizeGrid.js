// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

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

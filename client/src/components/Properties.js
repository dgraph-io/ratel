// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

// import "../assets/css/Properties.scss";

export default class Properties extends React.Component {
    render() {
        const { entity } = this.props;
        const nodeProperties = JSON.parse(entity.title);

        // Nodes have facets and attrs keys.
        const isEdge = Object.keys(nodeProperties).length === 1;
        const attrs = nodeProperties.attrs || {};
        const facets = nodeProperties.facets || {};

        return (
            <div className="properties">
                <span>Showing {isEdge ? "edge" : "node"}:</span>
                {!isEdge && (
                    <div>
                        <ul className="Properties">
                            {Object.keys(attrs).map((key, idx) => {
                                return (
                                    <li
                                        className="Properties-key-val"
                                        key={idx}
                                    >
                                        <span className="Properties-key">
                                            {key}:
                                        </span>
                                        <span className="Properties-val">
                                            {String(attrs[key])}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {Object.keys(facets).length > 0 && !isEdge && (
                    <span className="Properties-facets">Facets</span>
                )}
                <ul className="Properties">
                    {Object.keys(facets).map((key, idx) => {
                        return (
                            <li className="Properties-key-val" key={idx}>
                                <span className="Properties-key">{key}:</span>
                                <span className="Properties-val">
                                    {String(facets[key])}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

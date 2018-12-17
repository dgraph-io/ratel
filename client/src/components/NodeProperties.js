// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/lib/Button";
import Table from "react-bootstrap/lib/Table";

import "../assets/css/NodeProperties.scss";

export default function NodeProperties(props) {
    const { node } = props;

    if (!node) {
        return null;
    }

    const { attrs, facets } = node.properties;

    function openNode() {
        props.onExpandNode(node.uid);
    }

    return (
        <div className="graph-overlay">
            <label>{node && "uid: " + node.uid}</label>
            <div
                className="btn-toolbar"
                role="toolbar"
                aria-label="Node options"
            >
                <Button bsStyle="info" onClick={openNode}>
                    Expand
                </Button>
            </div>

            <Table striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>pred.</th>
                        <th>value</th>
                    </tr>
                </thead>
                <tbody>
                    {attrs
                        ? Object.keys(attrs).map(k => (
                              <tr key={k}>
                                  <td>{k}</td>
                                  <td>{JSON.stringify(attrs[k])}</td>
                              </tr>
                          ))
                        : null}
                </tbody>
            </Table>

            {facets && Object.keys(facets).length ? (
                <Table striped bordered condensed hover>
                    <thead>
                        <tr>
                            <th>facet</th>
                            <th>value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(facets).map(k => (
                            <tr key={k}>
                                <td>{k}</td>
                                <td>{attrs[k]}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
        </div>
    );
}

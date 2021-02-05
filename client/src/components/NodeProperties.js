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
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import "../assets/css/NodeProperties.scss";

export default function NodeProperties({ node, onCollapseNode, onExpandNode }) {
    if (!node) {
        return null;
    }

    const { attrs, facets } = node.properties;

    return (
        <div>
            <label>uid: {node.uid}</label>
            <div
                className="btn-toolbar mb-2"
                role="toolbar"
                aria-label="Node Options"
            >
                <Button
                    className="mr-2"
                    variant="info"
                    size="sm"
                    onClick={() =>
                        !node.expanded
                            ? onExpandNode(node.uid)
                            : onCollapseNode(node.uid)
                    }
                >
                    {!node.expanded ? "Expand" : "Collapse"}
                </Button>
            </div>

            <Table striped bordered size="sm" hover>
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
                <Table striped bordered size="sm" hover>
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
                                <td>{String(facets[k])}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
        </div>
    );
}

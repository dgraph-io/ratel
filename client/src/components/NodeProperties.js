/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import "../assets/css/NodeProperties.scss";

export default function NodeProperties({ node, onCollapseNode, onExpandNode }) {
    if (!node) {
        return null
    }

    const { attrs, facets } = node.properties

    return (
        <div>
            <label>uid: {node.uid}</label>
            <div className="btn-toolbar mb-2" role="toolbar" aria-label="Node Options">
                <Button
                    className="mr-2"
                    variant="info"
                    size="sm"
                    onClick={() =>
                        !node.expanded ? onExpandNode(node.uid) : onCollapseNode(node.uid)
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
                        ? Object.keys(attrs).map((k) => (
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
                        {Object.keys(facets).map((k) => (
                            <tr key={k}>
                                <td>{k}</td>
                                <td>{String(facets[k])}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
        </div>
    )
}

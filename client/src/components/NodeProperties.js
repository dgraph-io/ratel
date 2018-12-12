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
                <Button
                    variant="info"
                    size="sm"
                    className="mb-2"
                    onClick={openNode}
                >
                    Expand
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
                                <td>{attrs[k]}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
        </div>
    );
}

// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import classnames from "classnames";
import Table from "react-bootstrap/Table";

import GraphIcon from "../GraphIcon";

const SAMPLE_SIZE = 10;

const GRAPH_ICON = (
    <div className="icon-container">
        <GraphIcon />
    </div>
);

export default class SamplesTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            samples: null,
        };
    }

    componentDidMount() {
        this.fetchSample();
    }

    getPredicateSamplesQuery = predicate => `{
        samples(func: has(<${predicate}>), first: ${SAMPLE_SIZE}) {
            uid
            expand(_all_) {
              uid
              expand(_all_)
            }
        }
    }`;

    getExploreUidPropQuery = (uid, prop) => `{
        samples(func: uid(<${uid}>)) {
            uid
            <${prop}> {
              uid
              expand(_all_) {
                uid
                expand(_all_)
              }
            }
        }
    }`;

    async fetchSample() {
        const { predicate, uid: rootUid, prop, executeQuery } = this.props;

        const query = rootUid
            ? this.getExploreUidPropQuery(rootUid, prop)
            : this.getPredicateSamplesQuery(predicate);

        try {
            this.setState({ samplesLoading: true });

            const { data } = await executeQuery(query, "query");

            this.setState({
                samples: rootUid ? data.samples[0][prop] : data.samples,
            });
        } catch (errorMsg) {
            this.setState({
                fetchError: errorMsg,
            });
        } finally {
            this.setState({ samplesLoading: false });
        }
    }

    isLoading = () => this.state.samplesLoading;

    render() {
        const { samples, samplesLoading } = this.state;
        const {
            onExploreProp,
            onQueryUid,
            predicate,
            uid: rootUid,
        } = this.props;

        if (!samples) {
            return samplesLoading ? "Loading Samples" : "No Samples";
        }

        const goDeeperBtn = ({ uid, key }) => {
            if (!uid || !onExploreProp) {
                return null;
            }
            return (
                <Button
                    size="sm"
                    variant="info"
                    className="when-hovered"
                    onClick={() => onExploreProp(uid, key)}
                >
                    Explore&nbsp;
                    <i className="fas fa-search" />
                </Button>
            );
        };

        const isAtom = obj => typeof obj !== "object";

        const stringifyAtom = value =>
            value instanceof Object ? JSON.stringify(value) : value;

        const stringifyArray = arr => {
            if (arr.length >= 4) {
                return `[${stringifyAtom(arr[0])}, ${stringifyAtom(
                    arr[1],
                )},.. ${arr.length - 2} more values]`;
            }
            return `[${arr.map(x => stringifyAtom(x)).join(", ")}]`;
        };

        let rowIndex = 1;
        function renderProp(node, key, value) {
            if (key === "uid") {
                return null;
            }

            let goDeeper = null;

            if (value instanceof Array) {
                const len = value.length;
                goDeeper = { uid: node.uid, key };
                if (!len) {
                    value = "[]";
                    goDeeper = null;
                } else if (isAtom(value[0])) {
                    value = stringifyArray(value);
                } else {
                    value = `[${len} ${len === 1 ? "node" : "nodes"}]`;
                }
            }
            return (
                <tr
                    key={++rowIndex}
                    className={classnames("with-hover-btn", {
                        success: key === predicate,
                    })}
                >
                    <td>{key}</td>
                    <td>
                        {value instanceof Object
                            ? JSON.stringify(value)
                            : value}
                        &nbsp;
                        {!goDeeper ? null : goDeeperBtn(goDeeper)}
                    </td>
                </tr>
            );
        }

        const cards = samples.map(node => (
            <Card
                key={node.uid}
                className={classnames("mt-4", {
                    "with-hover-btn": !rootUid && !onExploreProp,
                })}
            >
                <Card.Body>
                    <Card.Title>
                        uid:&nbsp;
                        {node.uid}
                        {!onQueryUid ? null : (
                            <Button
                                size="sm"
                                variant="info"
                                className="when-hovered float-right"
                                onClick={() => onQueryUid(node.uid)}
                            >
                                {GRAPH_ICON}
                                &nbsp;Query
                            </Button>
                        )}
                    </Card.Title>

                    <Table size="sm">
                        <tbody>
                            {Object.entries(node).map(([k, v]) =>
                                renderProp(node, k, v),
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        ));

        return <div className="sample-cards">{cards}</div>;
    }
}

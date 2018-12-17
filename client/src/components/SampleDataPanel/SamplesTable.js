// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/lib/Button";
import classnames from "classnames";
import Table from "react-bootstrap/lib/Table";

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
                    bsSize="xsmall"
                    bsStyle="info"
                    className="when-hovered"
                    onClick={() => onExploreProp(uid, key)}
                >
                    Explore&nbsp;
                    <i className="fas fa-search" />
                </Button>
            );
        };

        let rowIndex = 1;
        function renderProp(node, key, value) {
            if (key === "uid") {
                return null;
            }

            let goDeeper = null;

            if (value instanceof Array) {
                const len = value.length;
                value = `[${len} ${len === 1 ? "value" : "values"}]`;
                goDeeper = { uid: node.uid, key };
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

        const rows = samples.map(node => (
            <tbody
                key={node.uid}
                className={classnames({
                    "with-hover-btn": !rootUid && !onExploreProp,
                })}
            >
                <tr key={node.uid} className="info">
                    <td>
                        uid:&nbsp;
                        {node.uid}
                    </td>
                    <td className="text-right">
                        {!onQueryUid ? null : (
                            <Button
                                bsSize="xsmall"
                                bsStyle="info"
                                className="when-hovered"
                                onClick={() => onQueryUid(node.uid)}
                            >
                                {GRAPH_ICON}
                                &nbsp;Query
                            </Button>
                        )}
                    </td>
                </tr>
                {Object.entries(node).map(([k, v]) => renderProp(node, k, v))}
                <tr key={"end-" + node.uid}>
                    <td />
                    <td />
                </tr>
            </tbody>
        ));

        return (
            <Table condensed hover>
                {rows}
            </Table>
        );
    }
}

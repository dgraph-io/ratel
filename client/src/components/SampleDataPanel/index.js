// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/lib/Button";
import Card from "react-bootstrap/lib/Card";
import Table from "react-bootstrap/lib/Table";

import GraphIcon from "../GraphIcon";
import SamplesTable from "./SamplesTable";

import "./index.scss";

const GRAPH_ICON = (
    <div className="icon-container">
        <GraphIcon />
    </div>
);

export default class SampleDataPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stats: null,
            lastUpdated: null,
        };

        this.samplesTable = React.createRef();
    }

    componentDidMount() {
        this.updateStats();
    }

    getStatsQuery = () => `{
  var(func: has(<${this.props.predicate.predicate}>)) {
    countValues as count(<${this.props.predicate.predicate}>)
  }

  nodeCount(func: has(<${this.props.predicate.predicate}>)) {
    nodeCount: count(uid)
  }

  stats() {
    totalCount: sum(val(countValues))
    avgCount: avg(val(countValues))
  }
}`;

    async updateStats() {
        try {
            this.setState({ statsLoading: true });

            const { data } = await this.props.executeQuery(
                this.getStatsQuery(),
                "query",
            );
            const { avgCount, totalCount } = Object.assign({}, ...data.stats);
            this.setState({
                stats: {
                    avgCount,
                    nodeCount: data.nodeCount[0].nodeCount,
                    totalCount,
                },
                lastUpdated: new Date(),
            });
        } catch (errorMsg) {
            this.setState({
                fetchError: errorMsg,
            });
        } finally {
            this.setState({ statsLoading: false });
        }
    }

    onQueryUid = uid =>
        this.props.onOpenGeneratedQuery(`{
  node(func: uid(${uid})) {
    uid
    expand(_all_) {
      uid
      expand(_all_)
    }
  }
}`);

    onQueryStats = () => this.props.onOpenGeneratedQuery(this.getStatsQuery());

    render() {
        const {
            predicate,
            predicate: { predicate: name },
        } = this.props;
        const { fetchError, stats, statsLoading } = this.state;

        if (!predicate) {
            return (
                <div className="alert alert-warning" role="alert">
                    Please select a predicate first.
                </div>
            );
        }

        return (
            <div className="col-sm-12 samples-panel pt-4">
                {!fetchError ? null : (
                    <div className="alert alert-warning" role="alert">
                        Something went wrong: {fetchError}
                    </div>
                )}

                <Card className="card-stats mb-5">
                    <Card.Body>
                        <Card.Title className="with-hover-btn">
                            Usage Stats &nbsp;
                            {!statsLoading ? null : (
                                <i className="fas fa-spinner fa-pulse" />
                            )}
                            <div className="float-right when-hovered">
                                <Button
                                    size="sm"
                                    variant="info"
                                    onClick={this.onQueryStats}
                                >
                                    {GRAPH_ICON}
                                    &nbsp;Query
                                </Button>
                            </div>
                        </Card.Title>
                        {!stats ? null : (
                            <Table
                                hover
                                bordered
                                size="sm"
                                className="with-hover-btn"
                            >
                                <tbody>
                                    <tr>
                                        <td>
                                            Nodes with <i>{name}</i>
                                        </td>
                                        <td className="text-right">
                                            {stats.nodeCount}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Average count per node</td>
                                        <td className="text-right">
                                            {Number(stats.avgCount).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Total number of values</td>
                                        <td className="text-right">
                                            {stats.totalCount}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>

                <h5>
                    Sample Data &nbsp;
                    {!this.samplesTable.current ||
                    this.samplesTable.current.isLoading ? null : (
                        <i className="fas fa-spinner fa-pulse" />
                    )}
                </h5>
                <SamplesTable
                    ref={this.samplesTable}
                    onQueryUid={this.onQueryUid}
                    executeQuery={this.props.executeQuery}
                    predicate={predicate.predicate}
                />
            </div>
        );
    }
}

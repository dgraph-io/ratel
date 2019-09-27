// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";

import GraphIcon from "../../GraphIcon";
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
  nodeCount(func: has(<${this.props.predicate.predicate}>)) {
    nodeCount: count(uid)
  }
}`;

    async updateStats() {
        try {
            this.setState({ statsLoading: true });

            const { data } = await this.props.executeQuery(
                this.getStatsQuery(),
                "query",
                true, // Ignore errors
            );
            this.setState({
                stats: {
                    nodeCount: data.nodeCount[0].nodeCount,
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
                        Could not query predicate statistics: {fetchError}
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

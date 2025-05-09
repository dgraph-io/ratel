/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";

import GraphIcon from "components/GraphIcon";
import SamplesTable from "./SamplesTable";

import "./index.scss";

const GRAPH_ICON = (
    <div className="icon-container">
        <GraphIcon />
    </div>
)

export default class SampleDataPanel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            stats: null,
            lastUpdated: null,
        }

        this.samplesTable = React.createRef()
    }

    componentDidMount() {
        this.updateStats()
    }

    getStatsQuery = () => `{
      nodeCount(func: has(<${this.props.predicate.predicate}>)) {
        nodeCount: count(uid)
      }
    }`

    async updateStats() {
        try {
            this.setState({ statsLoading: true })

            const { data } = await this.props.executeQuery(
                this.getStatsQuery(),
                "query",
                true, // Ignore errors
            )
            this.setState({
                stats: {
                    nodeCount: data.nodeCount[0].nodeCount,
                },
                lastUpdated: new Date(),
            })
        } catch (errorMsg) {
            this.setState({
                fetchError: errorMsg,
            })
        } finally {
            this.setState({ statsLoading: false })
        }
    }

    onQueryUid = (uid) =>
        this.props.onOpenGeneratedQuery(`{
  node(func: uid(${uid})) {
    uid
    expand(_all_) {
      uid
      expand(_all_)
    }
  }
}`)

    onQueryStats = () => this.props.onOpenGeneratedQuery(this.getStatsQuery())

    render() {
        const {
            predicate,
            predicate: { predicate: name },
        } = this.props
        const { fetchError, stats, statsLoading } = this.state

        if (!predicate) {
            return (
                <div className="alert alert-warning" role="alert">
                    Please select a predicate first.
                </div>
            )
        }

        return (
            <div className="col-sm-12 samples-panel pt-4">
                {!fetchError ? null : (
                    <div className="alert alert-warning" role="alert">
                        Could not query predicate statistics:{" "}
                        {JSON.stringify(fetchError?.message || fetchError)}
                    </div>
                )}

                <Card className="card-stats mb-5">
                    <Card.Body>
                        <Card.Title className="with-hover-btn">
                            Usage Stats &nbsp;
                            {!statsLoading ? null : <i className="fas fa-spinner fa-pulse" />}
                            <div className="float-right when-hovered">
                                <Button size="sm" variant="info" onClick={this.onQueryStats}>
                                    {GRAPH_ICON}
                                    &nbsp;Query
                                </Button>
                            </div>
                        </Card.Title>
                        {!stats ? null : (
                            <Table hover bordered size="sm" className="with-hover-btn">
                                <tbody>
                                    <tr>
                                        <td>
                                            Nodes with <i>{name}</i>
                                        </td>
                                        <td className="text-right">{stats.nodeCount}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>

                <h5>
                    Sample Data &nbsp;
                    {!this.samplesTable.current || this.samplesTable.current.isLoading ? null : (
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
        )
    }
}

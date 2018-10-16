import React from "react";
import Button from "react-bootstrap/lib/Button";
import classnames from "classnames";
import Table from "react-bootstrap/lib/Table";

import GraphIcon from "../GraphIcon";
import "./index.scss";

const SAMPLE_SIZE = 10;

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
            samples: null,
        };
    }

    componentDidMount() {
        this.updateStats();
        this.fetchSample();
    }

    async fetchSample() {
        const { predicate, executeQuery } = this.props;

        const query = `{
            samples(func: has(<${
                predicate.predicate
            }>), first: ${SAMPLE_SIZE}) {
                uid
                expand(_all_) {
                  uid
                  expand(_all_)
                }
            }
        }`;

        try {
            this.setState({ samplesLoading: true });

            const { data } = await executeQuery(query, "query", true);

            this.setState({
                samples: data.samples,
            });
        } catch (errorMsg) {
            this.setState({
                fetchError: errorMsg,
            });
        } finally {
            this.setState({ samplesLoading: false });
        }
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
                true,
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

    renderSamples(samples) {
        if (!samples) {
            return null;
        }

        const {
            predicate: { predicate: predicateName },
        } = this.props;

        let rowIndex = 1;
        function renderProp([key, value]) {
            if (key === "uid") {
                return null;
            }

            if (value instanceof Array) {
                const len = value.length;
                value = `[${len} ${len === 1 ? "value" : "values"}]`;
            }
            return (
                <tr
                    key={++rowIndex}
                    className={classnames({
                        success: key === predicateName,
                    })}
                >
                    <td>{key}</td>
                    <td>
                        {value instanceof Object
                            ? JSON.stringify(value)
                            : value}
                    </td>
                </tr>
            );
        }

        const rows = samples.map(node => (
            <tbody key={node.uid} className="with-hover-btn">
                <tr key={node.uid} className="info">
                    <td>
                        uid:&nbsp;
                        {node.uid}
                    </td>
                    <td className="text-right">
                        <Button
                            bsSize="xsmall"
                            bsStyle="info"
                            className="when-hovered"
                            onClick={() => this.onQueryUid(node.uid)}
                        >
                            {GRAPH_ICON}
                            &nbsp;Query
                        </Button>
                    </td>
                </tr>
                {Object.entries(node).map(renderProp)}
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

    render() {
        const {
            predicate,
            predicate: { predicate: name },
        } = this.props;
        const {
            fetchError,
            samples,
            stats,
            samplesLoading,
            statsLoading,
        } = this.state;

        if (!predicate) {
            return (
                <div className="alert alert-warning" role="alert">
                    Please select a predicate first.
                </div>
            );
        }

        return (
            <div className="auto-grow col-sm-12">
                {!fetchError ? null : (
                    <div className="alert alert-warning" role="alert">
                        Something went wrong: {fetchError}
                    </div>
                )}

                <div
                    className="panel panel-default with-hover-btn"
                    style={{ backgroundColor: "inherit" }}
                >
                    <div className="panel-heading">
                        Usage Stats &nbsp;
                        {!statsLoading ? null : (
                            <i className="fas fa-spinner fa-pulse" />
                        )}
                        <div className="pull-right when-hovered">
                            <Button
                                bsSize="xsmall"
                                bsStyle="info"
                                onClick={this.onQueryStats}
                            >
                                {GRAPH_ICON}
                                &nbsp;Query
                            </Button>
                        </div>
                    </div>
                    {!stats ? null : (
                        <Table condensed hover className="with-hover-btn">
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
                                        {stats.avgCount}
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
                </div>
                <br />
                <div
                    className="panel panel-default"
                    style={{ backgroundColor: "inherit" }}
                >
                    <div className="panel-heading">
                        Sample Data &nbsp;
                        {!samplesLoading ? null : (
                            <i className="fas fa-spinner fa-pulse" />
                        )}
                    </div>
                    {this.renderSamples(samples)}
                </div>
            </div>
        );
    }
}

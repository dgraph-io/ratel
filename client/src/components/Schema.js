import React from "react";
import ReactDataGrid from "react-data-grid";
import _ from "lodash";
import TimeAgo from "react-timeago";

import SchemaDropAllModal from "./SchemaDropAllModal";
import SchemaPredicateModal from "./SchemaPredicateModal";

import { checkStatus, getEndpoint } from "../lib/helpers";

import "datatables.net-bs/js/dataTables.bootstrap";
import "datatables.net-bs/css/dataTables.bootstrap.css";
import "../assets/css/Schema.scss";

const STATE_LOADING = 0;
const STATE_SUCCESS = 1;
const STATE_ERROR = 2;

const CHECK = (
    <i datasortkey={1} className="fa fa-check" style={{ color: "#28A744" }} />
);

const CROSS = (
    <i datasortkey={0} className="fa fa-times" style={{ color: "#DC3545" }} />
);

function boolRender(data) {
    return data ? CHECK : CROSS;
}

function timeAgoFormatter(value, unit, suffix) {
    if (unit === "second") {
        return `a few moments ${suffix}`;
    }
    if (value !== 1) {
        unit += "s";
    }

    return `${value} ${unit} ${suffix}`;
}

const isUserPredicate = name =>
    name !== "_predicate_" && name !== "_share_" && name !== "_share_hash_";

export default class Schema extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            schema: null,
            lastUpdated: null,
            fetchState: STATE_LOADING,
            modalIndex: -2,
            modalKey: 0,
            errorMsg: "",
            rows: [],
        };

        this.columns = [
            {
                key: "name",
                name: "Predicate",
                resizable: true,
                sortable: true,
            },
            {
                key: "type",
                name: "Type",
                resizable: true,
                sortable: true,
                width: 150,
            },
            {
                key: "indices",
                name: "Indices",
                resizable: true,
                sortable: true,
                width: 200,
            },
        ];

        this.gridContainer = React.createRef();

        this.modalKey = 1;
    }

    componentDidMount() {
        this.updateDataTable();
        this.fetchSchema();

        this.resizeInterval = setInterval(() => {
            if (this.gridContainer.current) {
                const height = this.gridContainer.current.offsetHeight;
                if (height !== this.state.gridHeight) {
                    this.setState({ gridHeight: height });
                }
            }
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.resizeInterval);
    }

    updateDataTable = () => {
        const { schema } = this.state;

        if (schema === null) {
            return;
        }

        const rows = schema
            .filter(p => isUserPredicate(p.predicate))
            .map((predicate, index) => {
                let type = predicate.type;
                if (predicate.list) {
                    type = "[" + type + "]";
                }
                if (predicate.type === "string" && predicate.lang) {
                    type += " @lang";
                }

                const badges = [];
                if (predicate.reverse) {
                    badges.push({
                        title: "Reverse",
                        text: "~",
                    });
                }
                if (predicate.count) {
                    badges.push({
                        title: "Count",
                        text: "C",
                    });
                }
                if (predicate.upsert) {
                    badges.push({
                        title: "Upsert",
                        text: "U",
                    });
                }

                let tokenizers = "";
                if (predicate.index) {
                    // Sort tokenizers for use with Datatables.
                    predicate.tokenizer.sort();
                    tokenizers = predicate.tokenizer.join(", ");
                }

                if (badges.length) {
                    tokenizers = (
                        <div>
                            <span>{tokenizers}</span>
                            <div className="schema-badges">
                                {badges.map(b => (
                                    <div title={b.title} key={b.title}>
                                        {b.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                return {
                    name: predicate.predicate,
                    type,
                    indices: tokenizers,
                    extraText: badges.map(b => b.title).join(" "),
                    index,
                    predicate,
                };
            });
        this.setState({ rows });
    };

    onRowClicked = index => index >= 0 && this.showModal(index);

    handleSort = (sortColumn, sortDirection) => {
        const comparer = (a, b) => {
            const sortDir = sortDirection === "ASC" ? 1 : -1;

            // For now React.elements only occur in bool columns.
            if (React.isValidElement(a[sortColumn])) {
                return a[sortColumn].props.datasortkey >
                    b[sortColumn].props.datasortkey
                    ? sortDir
                    : -sortDir;
            } else {
                return a[sortColumn] > b[sortColumn] ? sortDir : -sortDir;
            }
        };

        const rows =
            sortDirection === "NONE"
                ? this.state.rows.slice(0)
                : this.state.rows.sort(comparer);

        this.setState({ rows });
    };

    fetchSchema = () => {
        const { url } = this.props;

        this.setState({
            fetchState: STATE_LOADING,
        });

        fetch(getEndpoint(url, "query"), {
            method: "POST",
            mode: "cors",
            body: "schema {}",
            credentials: "same-origin",
        })
            .then(checkStatus)
            .then(response => response.json())
            .then(result => {
                const data = result.data;
                this.setState({ lastUpdated: new Date() });
                if (data.schema && !_.isEmpty(data.schema)) {
                    this.setState(
                        {
                            schema: data.schema,
                            fetchState: STATE_SUCCESS,
                            errorMsg: "",
                        },
                        this.updateDataTable,
                    );
                } else {
                    this.setState(
                        {
                            schema: null,
                            fetchState: STATE_ERROR,
                            errorMsg:
                                "Error reading fetched schema from server",
                        },
                        this.updateDataTable,
                    );
                }
            })
            .catch(error => {
                console.log(error.stack);
                console.warn(
                    "In catch: Error while trying to fetch schema",
                    error,
                );

                this.setState(
                    {
                        schema: null,
                        fetchState: STATE_ERROR,
                        errorMsg: "Error while trying to fetch schema",
                    },
                    this.updateDataTable,
                );

                return error;
            })
            .then(errorMsg => {
                if (errorMsg !== undefined) {
                    console.warn(
                        "Error while trying to fetch schema",
                        errorMsg,
                    );
                }
            });
    };

    showModal = modalIndex => {
        this.setState({
            modalIndex,
            modalKey: this.modalKey++,
        });
    };

    // TODO: wtf are these magic numbers. Refactor.
    handleNewClick = () => this.showModal(-1);

    handleDropAllClick = () => this.showModal(-3);

    handleModalClose = () =>
        this.setState({
            modalIndex: -2,
        });

    handleModalCancel = () => {};

    handleDropAll = () => {
        this.setState({
            schema: [],
        });
        this.fetchSchema();
    };

    handlePredicateUpdate = (idx, predicate, deleted) => {
        const { schema } = this.state;

        if (deleted) {
            if (schema.length > idx) {
                schema.splice(idx, 1);
            }
        } else if (idx < 0) {
            schema.push(predicate);
        } else {
            schema[idx] = predicate;
        }

        this.setState({
            schema,
        });
        this.fetchSchema();
    };

    isSchemaEmpty = () => {
        const { schema } = this.state;
        if (schema == null || schema.length === 0) {
            return true;
        }
        if (schema.length > 3) {
            return false;
        }
        return schema.findIndex(p => isUserPredicate(p.predicate)) < 0;
    };

    renderModalComponent = () => {
        const { url, onUpdateConnectedState } = this.props;
        const { modalIndex, modalKey, rows, schema } = this.state;

        if (schema && modalIndex >= -1) {
            return (
                <SchemaPredicateModal
                    key={modalKey}
                    create={modalIndex < 0}
                    idx={modalIndex}
                    predicate={modalIndex < 0 ? {} : rows[modalIndex].predicate}
                    url={url}
                    onUpdatePredicate={this.handlePredicateUpdate}
                    onUpdateConnectedState={onUpdateConnectedState}
                    onCancel={this.handleModalCancel}
                    onClose={this.handleModalClose}
                />
            );
        }
        if (modalIndex < -2) {
            return (
                <SchemaDropAllModal
                    key={modalKey}
                    url={url}
                    onDropAll={this.handlePredicateUpdate}
                    onUpdateConnectedState={onUpdateConnectedState}
                    onCancel={this.handleModalCancel}
                    onClose={this.handleModalClose}
                />
            );
        }
        return null;
    };

    render() {
        const { errorMsg, fetchState, lastUpdated, schema } = this.state;

        let alertDiv;
        if (fetchState === STATE_ERROR) {
            alertDiv = (
                <div className="col-sm-12">
                    <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>
                </div>
            );
        }

        const buttonsDiv = (
            <div className="btn-toolbar">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleNewClick}
                >
                    Add Predicate
                </button>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={this.handleDropAllClick}
                >
                    Drop All
                </button>
                <button
                    className="btn btn-default btn-sm"
                    disabled={fetchState === STATE_LOADING}
                    onClick={this.fetchSchema}
                >
                    {fetchState === STATE_LOADING
                        ? "Refreshing Schema..."
                        : "Refresh Schema"}
                </button>
                {lastUpdated == null ? null : (
                    <span
                        style={{
                            color: "#888888",
                            display: "inline-block",
                            padding: "6px 0 0 4px",
                        }}
                    >
                        Updated
                        <TimeAgo
                            date={lastUpdated}
                            formatter={timeAgoFormatter}
                            minPeriod={10}
                        />
                    </span>
                )}
            </div>
        );

        const modalComponent = this.renderModalComponent();

        let dataDiv;
        if (schema != null) {
            if (this.isSchemaEmpty()) {
                dataDiv = (
                    <div className="panel panel-default">
                        <div className="panel-body">
                            There are no predicates in the schema. Click the
                            button above to add a new predicate.
                        </div>
                    </div>
                );
            } else {
                dataDiv = (
                    <div className="grid-container" ref={this.gridContainer}>
                        <ReactDataGrid
                            columns={this.columns}
                            rowGetter={idx => this.state.rows[idx]}
                            rowsCount={this.state.rows.length}
                            minHeight={this.state.gridHeight}
                            onGridSort={this.handleSort}
                            onRowClick={this.onRowClicked}
                            rowSelection={{
                                showCheckbox: false,
                            }}
                        />
                    </div>
                );
            }
        }

        return (
            <div className="container-fluid schema-view">
                <h2>Schema</h2>
                {alertDiv}
                {buttonsDiv}
                {dataDiv}
                {modalComponent}
            </div>
        );
    }
}

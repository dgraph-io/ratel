import React from "react";
import $ from "jquery";
import "datatables.net-bs";
import _ from "lodash";
import TimeAgo from "react-timeago";

import SchemaPredicateModal from "./SchemaPredicateModal";

import { checkStatus, getEndpoint } from "../lib/helpers";

import "datatables.net-bs/js/dataTables.bootstrap";
import "datatables.net-bs/css/dataTables.bootstrap.css";
import "../assets/css/Schema.scss";

const STATE_LOADING = 0;
const STATE_SUCCESS = 1;
const STATE_ERROR = 2;

const CHECK = '<i class="fa fa-check" style="color: #28A744" />';
const CROSS = '<i class="fa fa-times" style="color: #DC3545" />';

function boolNumber(data) {
    return data ? 1 : 0;
}

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

export default class Schema extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            schema: null,
            lastUpdated: null,
            state: STATE_LOADING,
            modalIndex: -2,
            modalKey: 0,
            errorMsg: "",
        };

        this.datatable = null;
        this.initializedDataTables = false;
        this.modalKey = 1;
    }

    componentDidMount() {
        this.updateDataTable();
        this.fetchSchema();
    }

    updateDataTable = () => {
        const { schema } = this.state;

        const rows = [];
        if (schema != null) {
            schema.forEach((predicate, idx) => {
                if (
                    predicate.predicate === "_predicate_" ||
                    predicate.predicate === "_share_" ||
                    predicate.predicate === "_share_hash_"
                ) {
                    return;
                }

                let type = predicate.type;
                if (predicate.list) {
                    type = "[" + type + "]";
                }
                if (predicate.type === "string" && predicate.lang) {
                    type += " @lang";
                }

                let tokenizers = "";
                if (predicate.index) {
                    // Sort tokenizers for use with Datatables.
                    predicate.tokenizer.sort();
                    tokenizers = predicate.tokenizer.join(", ");
                }
                if (predicate.reverse) {
                    tokenizers = "reverse";
                }

                rows.push([
                    predicate.predicate,
                    type,
                    tokenizers,
                    boolNumber(predicate.upsert),
                    boolNumber(predicate.count),
                    idx,
                    predicate,
                ]);
            });
        }

        if (this.initializedDataTables) {
            this.datatable.clear();
            this.datatable.rows.add(rows);
            this.datatable.draw();
        } else {
            this.datatable = $("#schema-table").DataTable({
                data: rows,
                columns: [
                    { title: "Predicate" },
                    { title: "Type" },
                    { title: "Indices" },
                    {
                        title: "Upsert",
                        searchable: false,
                        render: boolRender,
                    },
                    {
                        title: "Count",
                        searchable: false,
                        render: boolRender,
                    },
                ],
                order: [[0, "asc"]],
                scrollX: true,
            });

            this.initializedDataTables = true;

            const that = this;
            const table = this.datatable;
            $("#schema-table").on("click", "tr", function() {
                var data = table.row(this).data();
                that.showModal(data[5]);
            });
        }
    };

    fetchSchema = () => {
        const { url } = this.props;

        this.setState({
            state: STATE_LOADING,
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
                if (data.schema && !_.isEmpty(data.schema)) {
                    this.setState(
                        {
                            schema: data.schema,
                            lastUpdated: new Date(),
                            state: STATE_SUCCESS,
                            errorMsg: "",
                        },
                        () => {
                            this.updateDataTable();
                        },
                    );
                } else {
                    this.setState(
                        {
                            schema: null,
                            lastUpdated: new Date(),
                            state: STATE_ERROR,
                            errorMsg:
                                "Error reading fetched schema from server",
                        },
                        () => {
                            this.updateDataTable();
                        },
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
                        lastUpdated: new Date(),
                        state: STATE_ERROR,
                        errorMsg: "Error while trying to fetch schema",
                    },
                    () => {
                        this.updateDataTable();
                    },
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

    showModal = idx => {
        this.setState({
            modalIndex: idx,
            modalKey: this.modalKey,
        });

        this.modalKey++;
    };

    handleNewClick = () => {
        this.showModal(-1);
    };

    handleModalClose = () => {
        this.setState({
            modalIndex: -2,
        });
    };

    handleModalCancel = () => {};

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

        this.fetchSchema();
    };

    isSchemaEmpty = () => {
        const { schema } = this.state;

        if (schema == null || schema.length === 0) {
            return true;
        } else if (schema.length <= 3) {
            for (let predicate of schema) {
                if (
                    predicate.predicate !== "_predicate_" &&
                    predicate.predicate !== "_share_" &&
                    predicate.predicate !== "_share_hash_"
                ) {
                    return false;
                }
            }

            return true;
        }

        return false;
    };

    render() {
        const { url, onUpdateConnectedState } = this.props;
        const {
            schema,
            lastUpdated,
            state,
            modalIndex,
            modalKey,
            errorMsg,
        } = this.state;

        let alertDiv;
        if (state === STATE_ERROR) {
            alertDiv = (
                <div className="col-sm-12">
                    <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>
                </div>
            );
        }

        const buttonsDiv = (
            <div className="col-sm-12" style={{ marginBottom: "12px" }}>
                <button
                    className="btn btn-primary"
                    onClick={this.handleNewClick}
                    style={{
                        marginRight: "15px",
                    }}
                >
                    Add Predicate
                </button>
                <button
                    className="btn btn-default"
                    disabled={state === STATE_LOADING}
                    onClick={this.fetchSchema}
                    style={{
                        marginRight: "10px",
                    }}
                >
                    {state === STATE_LOADING
                        ? "Refreshing Schema..."
                        : "Refresh Schema"}
                </button>
                {lastUpdated == null ? null : (
                    <span style={{ color: "#888888" }}>
                        Updated{" "}
                        <TimeAgo
                            date={lastUpdated}
                            formatter={timeAgoFormatter}
                            minPeriod={10}
                        />
                    </span>
                )}
            </div>
        );

        let modalComponent;
        if (schema != null && modalIndex >= -1) {
            modalComponent = (
                <SchemaPredicateModal
                    key={modalKey}
                    create={modalIndex < 0}
                    idx={modalIndex}
                    predicate={modalIndex < 0 ? {} : schema[modalIndex]}
                    url={url}
                    onUpdatePredicate={this.handlePredicateUpdate}
                    onUpdateConnectedState={onUpdateConnectedState}
                    onCancel={this.handleModalCancel}
                    onClose={this.handleModalClose}
                />
            );
        }

        const tableDivStyle = {};
        let dataDiv;
        if (schema != null) {
            if (this.isSchemaEmpty()) {
                tableDivStyle.display = "none";

                dataDiv = (
                    <div className="col-sm-12" style={{ marginTop: "15px" }}>
                        <div className="panel panel-default">
                            <div className="panel-body">
                                There are no predicates in the schema. Click the
                                button above to add a new predicate.
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            tableDivStyle.display = "none";
        }

        return (
            <div
                className="container-fluid"
                style={{
                    paddingTop: "12px",
                    paddingBottom: "6px",
                    backgroundColor: "#f3f3f3",
                }}
            >
                <div className="row justify-content-md-center">
                    {alertDiv}
                    {buttonsDiv}
                    {dataDiv}
                    <div className="col-sm-12" style={tableDivStyle}>
                        <div className="table-responsive">
                            <table
                                id="schema-table"
                                className="table table-hover table-striped table-bordered"
                                cellSpacing="0"
                                style={{ width: "100%" }}
                            />
                        </div>
                    </div>
                    {modalComponent}
                </div>
            </div>
        );
    }
}

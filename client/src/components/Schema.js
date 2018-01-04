import React from "react";
import $ from "jquery";
import "datatables.net-bs";
import _ from "lodash";
import TimeAgo from "react-timeago";

import SchemaPredicate from "./SchemaPredicate";

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
            errorMsg: "",
        };

        this.datatable = null;
        this.initializedDataTables = false;
    }

    componentDidMount() {
        this.updateDataTable();
        this.fetchSchema();
    }

    updateDataTable = () => {
        const { schema } = this.state;

        const rows = [];
        if (schema != null) {
            schema.forEach(predicate => {
                if (predicate.predicate === "_predicate_") {
                    return;
                }

                let type = predicate.type;
                if (predicate.list) {
                    type = "[" + type + "]";
                }

                let hasIndex = !!predicate.index;
                let tokenizers = "";
                if (hasIndex) {
                    // Sort tokenizers for use with Datatables.
                    predicate.tokenizer.sort();
                    tokenizers = predicate.tokenizer.join(", ");
                }

                rows.push([
                    predicate.predicate,
                    type,
                    boolNumber(hasIndex),
                    tokenizers,
                    boolNumber(predicate.count),
                    boolNumber(predicate.reverse),
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
                    {
                        title: "Indexed",
                        searchable: false,
                        render: boolRender,
                    },
                    { title: "Tokenizer(s)" },
                    {
                        title: "Count",
                        searchable: false,
                        render: boolRender,
                    },
                    {
                        title: "Reverse",
                        searchable: false,
                        render: boolRender,
                    },
                ],
                order: [[0, "asc"]],
                scrollX: true,
            });

            this.initializedDataTables = true;
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

    handlePredicateUpdate = () => {};

    render() {
        const { url, onUpdateConnectedState } = this.props;
        const { schema, lastUpdated, state, errorMsg } = this.state;

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

        const rows = [];
        if (schema != null) {
            let i = 1;
            schema.forEach(predicate => {
                if (predicate.predicate === "_predicate_") {
                    return;
                }

                let type = predicate.type;
                if (predicate.list) {
                    type = "[" + type + "]";
                }

                let hasIndex = !!predicate.index;
                let tokenizers = "";
                if (hasIndex) {
                    tokenizers = predicate.tokenizer.join(", ");
                }

                const id = "predicate-" + i.toString();

                rows.push(
                    <tr
                        className="accordion-toggle"
                        data-toggle="collapse"
                        data-target={"#" + id}
                    >
                        <td>{predicate.predicate}</td>
                        <td>{type}</td>
                        <td>{hasIndex ? CHECK : CROSS}</td>
                        <td>{tokenizers}</td>
                        <td>{predicate.count ? CHECK : CROSS}</td>
                        <td>{predicate.reverse ? CHECK : CROSS}</td>
                    </tr>,
                    <tr>
                        <td colspan="6" style={{ padding: 0 }}>
                            <div id={id} className="accordian-body collapse">
                                <div style={{ width: "80px", height: "80px" }}>
                                    Hello World!
                                </div>
                                <SchemaPredicate
                                    url={url}
                                    predicate={predicate}
                                    onUpdatePredicate={
                                        this.handlePredicateUpdate
                                    }
                                    onUpdateConnectedState={
                                        onUpdateConnectedState
                                    }
                                />
                            </div>
                        </td>
                    </tr>,
                );

                i++;
            });
        }

        const refreshDiv = (
            <div className="col-sm-12" style={{ marginBottom: "12px" }}>
                <button
                    className="btn btn-info"
                    disabled={state === STATE_LOADING}
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

        return (
            <div className="row justify-content-md-center">
                {alertDiv}
                {refreshDiv}
                <div className="col-sm-12">
                    <div className="table-responsive">
                        <table
                            id="schema-table"
                            className="table table-hover table-striped table-bordered"
                            cellSpacing="0"
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

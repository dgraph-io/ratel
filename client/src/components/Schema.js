// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import ReactDataGrid from "react-data-grid";
import _ from "lodash";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import TimeAgo from "react-timeago";

import AutosizeGrid from "./AutosizeGrid";
import SampleDataPanel from "./SampleDataPanel";
import SchemaDropAllModal from "./SchemaDropAllModal";
import SchemaPredicateModal from "./SchemaPredicateModal";
import SchemaRawModeModal from "./SchemaRawModeModal";
import VerticalPanelLayout from "./PanelLayout/VerticalPanelLayout";
import PredicatePropertiesPanel from "./PredicatePropertiesPanel";

import { isUserPredicate } from "../lib/dgraph-syntax";
import { executeQuery, checkStatus, getEndpoint } from "../lib/helpers";
import sortDataGrid from "../lib/sortDataGrid";

import "../assets/css/Schema.scss";

const STATE_LOADING = 0;
const STATE_SUCCESS = 1;
const STATE_ERROR = 2;

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
            rightPaneTab: "props",
            fetchState: STATE_LOADING,
            modalKey: 0,
            errorMsg: "",
            rows: [],
            selectedIndex: -1,
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
                width: 150,
            },
        ];

        this.gridContainer = React.createRef();
        this.dataGrid = React.createRef();

        this.modalKey = 1;
    }

    componentDidMount() {
        this.updateDataTable();
        this.fetchSchema();

        this.resizeInterval = setInterval(() => {
            if (this.gridContainer.current) {
                const height = this.gridContainer.current.offsetHeight;
                const width = this.gridContainer.current.offsetWidth;
                if (
                    height !== this.state.gridHeight ||
                    width !== this.state.gridWidth
                ) {
                    this.setState(
                        {
                            gridHeight: height,
                            gridWidth: width,
                        },
                        () => this.dataGrid.current.metricsUpdated(),
                    );
                }
            }
        }, 600);
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
                    predicate.tokenizer.sort();
                    tokenizers = predicate.tokenizer.join(", ");
                }

                if (badges.length) {
                    const sortkey = `${tokenizers} ${badges
                        .map(b => b.title)
                        .join(" ")}`;
                    tokenizers = (
                        <div datasortkey={sortkey}>
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

        const { selectedPredicateName } = this.state;
        const newIndex = rows.findIndex(r => r.name === selectedPredicateName);
        this.setState({
            selectedIndex: newIndex,
        });
    };

    onRowClicked = index => {
        if (index < 0) {
            return;
        }
        this.setState({
            selectedPredicateName: this.state.rows[index].predicate.predicate,
            selectedIndex: index,
        });
    };

    handleSort = (sortColumn, sortDirection) => {
        const rows = sortDataGrid(sortColumn, sortDirection, this.state.rows);

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
                console.error(error.stack);
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

    showModal = modalType => {
        this.setState({
            modalKey: this.modalKey++,

            showBulkSchemaDialog: false,
            showCreateDialog: false,
            showDropAllDialog: false,

            [modalType]: true,
        });
    };

    handleNewPredicateClick = () => this.showModal("showCreateDialog");

    handleDropAllClick = () => this.showModal("showDropAllDialog");

    handleRawSchemaClick = () => this.showModal("showBulkSchemaDialog");

    handleCloseModal = () =>
        this.setState({
            showBulkSchemaDialog: false,
            showCreateDialog: false,
            showDropAllDialog: false,
        });

    handleAfterDropAll = () => {
        this.fetchSchema();
        this.handleCloseModal();
    };

    handleAfterDropSelectedPredicate = () => {
        this.setState({
            selectedIndex: -1,
            selectedPredicateName: null,
        });
        this.fetchSchema();
    };

    handleAfterUpdatePredicate = () => {
        this.fetchSchema();
        this.handleCloseModal();
    };

    executeSchemaQuery = async (query, action, ignoreErrors = false) => {
        const { onUpdateConnectedState, url } = this.props;
        let serverReplied = false;

        try {
            const res = await executeQuery(url, query, { action });
            serverReplied = true;

            if (res.errors) {
                throw { serverErrorMessage: res.errors[0].message };
            }

            return res;
        } catch (error) {
            if (!error) {
                throw `Could not connect to the server: Unkown Error`;
            }
            if (error.serverErrorMessage) {
                // This is an error thrown from above. Rethrow.
                throw error.serverErrorMessage;
            }
            // If no response, it's a network error or client side runtime error.
            const errorText = error.response
                ? await error.response.text()
                : error.message || error;

            throw `Could not connect to the server: ${errorText}`;
        } finally {
            if (!ignoreErrors || serverReplied) {
                onUpdateConnectedState(serverReplied);
            }
        }
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
        const {
            modalKey,
            schema,
            showCreateDialog,
            showDropAllDialog,
            showBulkSchemaDialog,
        } = this.state;

        if (showCreateDialog) {
            return (
                <SchemaPredicateModal
                    key={modalKey}
                    create={true}
                    predicate={{}}
                    onAfterUpdate={this.handleAfterUpdatePredicate}
                    executeQuery={this.executeSchemaQuery}
                    onCancel={this.handleCloseModal}
                />
            );
        } else if (showDropAllDialog) {
            return (
                <SchemaDropAllModal
                    key={modalKey}
                    executeQuery={this.executeSchemaQuery}
                    onAfterDropAll={this.handleAfterDropAll}
                    onCancel={this.handleCloseModal}
                />
            );
        } else if (showBulkSchemaDialog) {
            return (
                <SchemaRawModeModal
                    key={modalKey}
                    schema={schema}
                    executeQuery={this.executeSchemaQuery}
                    onAfterUpdate={this.handleAfterUpdatePredicate}
                    onCancel={this.handleCloseModal}
                    onDropAll={this.handleDropAllClick}
                />
            );
        }
        return null;
    };

    renderToolbar = () => {
        const { fetchState, lastUpdated, schema } = this.state;
        return (
            <div className="btn-toolbar schema-toolbar" key="buttonsDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleNewPredicateClick}
                >
                    Add Predicate
                </button>
                <button
                    className="btn btn-default btn-sm"
                    disabled={fetchState === STATE_LOADING || !schema}
                    onClick={this.handleRawSchemaClick}
                >
                    Bulk Edit
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
                {!lastUpdated ? null : (
                    <span
                        style={{
                            color: "#888",
                            display: "inline-block",
                            fontSize: 12,
                            padding: "8px 0 0 8px",
                        }}
                    >
                        Updated&nbsp;
                        <TimeAgo
                            date={lastUpdated}
                            formatter={timeAgoFormatter}
                            minPeriod={10}
                        />
                    </span>
                )}
            </div>
        );
    };

    render() {
        const {
            errorMsg,
            fetchState,
            rows,
            schema,
            selectedPredicateName,
            selectedIndex,
        } = this.state;
        const { onOpenGeneratedQuery } = this.props;

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

        let dataDiv;
        if (schema != null) {
            if (this.isSchemaEmpty()) {
                dataDiv = (
                    <div className="panel panel-default" key="dataDiv">
                        <div className="panel-body">
                            There are no predicates in the schema. Click the
                            button above to add a new predicate.
                        </div>
                    </div>
                );
            } else {
                const { gridHeight } = this.state;
                dataDiv = (
                    <div
                        className="grid-container"
                        key="dataDiv"
                        ref={this.gridContainer}
                    >
                        <ReactDataGrid
                            columns={this.columns}
                            ref={this.dataGrid}
                            rowGetter={idx => rows[idx]}
                            rowsCount={rows.length}
                            minHeight={gridHeight}
                            onGridSort={this.handleSort}
                            onRowClick={this.onRowClicked}
                            rowSelection={{
                                showCheckbox: false,
                                selectBy: {
                                    keys: {
                                        rowKey: "name",
                                        values: [selectedPredicateName],
                                    },
                                },
                            }}
                        />
                    </div>
                );
            }
        }

        const rightPane = (
            <Tabs
                className="tabs-container"
                id="right-tabs"
                activeKey={this.state.rightPaneTab}
                onSelect={rightPaneTab => this.setState({ rightPaneTab })}
            >
                <Tab eventKey="props" title="Properties" className="auto-grow">
                    {!rows || selectedIndex < 0 ? null : (
                        <PredicatePropertiesPanel
                            key={JSON.stringify(rows[selectedIndex].predicate)}
                            predicate={rows[selectedIndex].predicate}
                            executeQuery={this.executeSchemaQuery}
                            onAfterUpdate={this.fetchSchema}
                            onAfterDrop={this.handleAfterDropSelectedPredicate}
                        />
                    )}
                </Tab>
                <Tab
                    eventKey="data"
                    title="Samples & Statistics"
                    className="nostretch"
                >
                    {!rows || selectedIndex < 0 ? null : (
                        <SampleDataPanel
                            key={JSON.stringify(rows[selectedIndex].predicate)}
                            predicate={rows[selectedIndex].predicate}
                            executeQuery={this.executeSchemaQuery}
                            onOpenGeneratedQuery={onOpenGeneratedQuery}
                        />
                    )}
                </Tab>
            </Tabs>
        );

        return (
            <div className="schema-view">
                <h2>Schema</h2>
                {alertDiv}
                <VerticalPanelLayout
                    defaultRatio={0.5}
                    first={[this.renderToolbar(), dataDiv]}
                    second={rightPane}
                />

                {this.renderModalComponent()}
            </div>
        );
    }
}

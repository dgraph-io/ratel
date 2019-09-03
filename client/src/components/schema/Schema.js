// Copyright 2018-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import isEmpty from "lodash.isempty";
import TimeAgo from "react-timeago";

import EditTypeModal from "./EditTypeModal";
import PredicatesTable from "./PredicatesTable";
import PredicateTabs from "./PredicateTabs";
import SchemaDropAllModal from "./SchemaDropAllModal";
import SchemaPredicateModal from "./SchemaPredicateModal";
import SchemaRawModeModal from "./SchemaRawModeModal";
import TypeProperties from "./TypeProperties";
import TypesTable from "./TypesTable";
import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";

import { isUserPredicate } from "../../lib/dgraph-syntax";
import { executeQuery, getDgraphClient } from "../../lib/helpers";

import "./Schema.scss";

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
    state = {
        schema: [],
        types: [],
        leftPaneTab: "predicates", // predicates or types
        fetchState: STATE_LOADING,
        modalKey: 0,
    };

    componentDidMount() {
        this.fetchSchema();
    }

    fetchSchema = async () => {
        const { url } = this.props;

        this.setState({
            fetchState: STATE_LOADING,
        });

        try {
            const client = await getDgraphClient(url.url);
            const schemaResponse = await client.newTxn().query("schema {}");

            const data = schemaResponse.data;
            this.setState({ lastUpdated: new Date() });
            if (data.schema && !isEmpty(data.schema)) {
                this.setState({
                    schema: data.schema,
                    types: data.types,
                    fetchState: STATE_SUCCESS,
                    errorMsg: "",
                });
            } else {
                this.setState({
                    schema: [],
                    types: [],
                    fetchState: STATE_ERROR,
                    errorMsg: "Error reading fetched schema from server",
                });
            }
        } catch (error) {
            console.error(error.stack);
            console.warn("In catch: Error while trying to fetch schema", error);

            this.setState({
                schema: [],
                types: [],
                fetchState: STATE_ERROR,
                errorMsg: "Error while trying to fetch schema",
            });

            return error;
        }
    };

    showModal = modalType => {
        this.setState({
            modalKey: this.state.modalKey + 1,
            activeModalName: modalType,
        });
    };

    handleNewPredicateClick = () => this.showModal("CreatePredicate");

    handleDropAllClick = () => this.showModal("DropAllPredicates");

    handleRawSchemaClick = () => this.showModal("BulkSchema");

    handleNewTypeClick = () => this.showModal("CreateType");

    handleCloseModal = () =>
        this.setState({
            activeModalName: null,
        });

    handleEditSelectedType = () => {
        if (!this.getSelectedType()) {
            return;
        }
        this.showModal("EditSelectedType");
    };

    handleAfterDropAll = () => {
        this.fetchSchema();
        this.handleCloseModal();
    };

    handleAfterDropSelectedPredicate = () => {
        this.setState({
            selectedPredicateName: null,
        });
        this.fetchSchema();
    };

    handleAfterUpdate = () => {
        this.fetchSchema();
        this.handleCloseModal();
    };

    executeSchemaQuery = async (query, action) => {
        const { url } = this.props;

        try {
            const res = await executeQuery(url.url, query, { action });

            if (res.errors) {
                throw { serverErrorMessage: res.errors[0].message };
            }

            return res;
        } catch (error) {
            if (!error) {
                throw "Unkown Error";
            }
            if (error.serverErrorMessage) {
                // This is an error thrown from above. Rethrow.
                throw error.serverErrorMessage;
            }
            // If no response, it's a network error or client side runtime error.
            const errorText = error.response
                ? await error.response.text()
                : error.message || error;

            throw errorText;
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
        const { activeModalName, modalKey, schema } = this.state;

        switch (activeModalName) {
            case "CreatePredicate":
                return (
                    <SchemaPredicateModal
                        key={modalKey}
                        create={true}
                        predicate={{}}
                        onAfterUpdate={this.handleAfterUpdate}
                        executeQuery={this.executeSchemaQuery}
                        onCancel={this.handleCloseModal}
                    />
                );
            case "DropAllPredicates":
                return (
                    <SchemaDropAllModal
                        key={modalKey}
                        executeQuery={this.executeSchemaQuery}
                        onAfterDropAll={this.handleAfterDropAll}
                        onCancel={this.handleCloseModal}
                    />
                );
            case "BulkSchema":
                return (
                    <SchemaRawModeModal
                        key={modalKey}
                        schema={schema}
                        executeQuery={this.executeSchemaQuery}
                        onAfterUpdate={this.handleAfterUpdate}
                        onCancel={this.handleCloseModal}
                        onDropAll={this.handleDropAllClick}
                    />
                );
            case "CreateType":
                return (
                    <EditTypeModal
                        key={modalKey}
                        executeQuery={this.executeSchemaQuery}
                        schema={schema}
                        onAfterUpdate={this.handleAfterUpdate}
                        onCancel={this.handleCloseModal}
                        isCreate={true}
                    />
                );
            case "EditSelectedType":
                return (
                    <EditTypeModal
                        key={modalKey}
                        executeQuery={this.executeSchemaQuery}
                        schema={schema}
                        onAfterUpdate={this.handleAfterUpdate}
                        onCancel={this.handleCloseModal}
                        isCreate={false}
                        type={this.getSelectedType()}
                    />
                );
            default:
                return null;
        }
    };

    renderToolbar = () => {
        const { fetchState, lastUpdated, leftPaneTab } = this.state;
        return (
            <div className="btn-toolbar schema-toolbar" key="buttonsDiv">
                {leftPaneTab === "predicates" && (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={this.handleNewPredicateClick}
                    >
                        Add Predicate
                    </button>
                )}

                {leftPaneTab === "types" && (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={this.handleNewTypeClick}
                    >
                        Add Type
                    </button>
                )}

                <button
                    className="btn btn-sm"
                    onClick={() => this.setState({ leftPaneTab: "predicates" })}
                >
                    <input
                        type="radio"
                        name="action"
                        checked={leftPaneTab === "predicates"}
                        onChange={() =>
                            this.setState({ leftPaneTab: "predicates" })
                        }
                    />
                    &nbsp;Predicates
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => this.setState({ leftPaneTab: "types" })}
                >
                    <input
                        type="radio"
                        name="action"
                        checked={leftPaneTab === "types"}
                        onClick={() => this.setState({ leftPaneTab: "types" })}
                    />
                    &nbsp;Types
                </button>

                {leftPaneTab === "predicates" && (
                    <button
                        className="btn btn-default btn-sm"
                        disabled={fetchState === STATE_LOADING}
                        onClick={this.handleRawSchemaClick}
                    >
                        Bulk Edit
                    </button>
                )}
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

    getSelectedType = () => {
        const { types = [], selectedTypeName } = this.state;
        const res = types.find(t => t.name === selectedTypeName);
        if (selectedTypeName && !res) {
            this.setState({ selectedTypeName: null });
        }
        return res;
    };

    render() {
        const {
            errorMsg,
            fetchState,
            leftPaneTab,
            schema,
            selectedPredicateName,
            types = [],
        } = this.state;
        const { onOpenGeneratedQuery } = this.props;

        const selectedPredicate = schema.find(
            p => p.predicate === selectedPredicateName,
        );

        if (selectedPredicateName && !selectedPredicate) {
            this.setState({ selectedPredicateName: null });
        }

        const selectedType = this.getSelectedType();

        const alertDiv =
            fetchState !== STATE_ERROR ? null : (
                <div className="col-sm-12">
                    <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>
                </div>
            );

        const renderSchemaTable = () =>
            !schema || this.isSchemaEmpty() ? (
                <div className="panel panel-default" key="dataDiv">
                    <div className="panel-body">
                        There are no predicates in the schema. Click the button
                        above to add a new predicate.
                    </div>
                </div>
            ) : (
                <PredicatesTable
                    schema={schema}
                    selectedPredicate={selectedPredicate}
                    onChangeSelectedPredicate={p =>
                        this.setState({
                            selectedPredicateName: p && p.predicate,
                        })
                    }
                />
            );

        const renderTypesTable = () =>
            !schema || this.isSchemaEmpty() ? (
                <div className="panel panel-default" key="dataDiv">
                    <div className="panel-body">
                        There are no predicates in the schema. Click the button
                        above to add a new predicate.
                    </div>
                </div>
            ) : (
                <TypesTable
                    types={types}
                    selectedType={selectedType}
                    onChangeSelectedType={t =>
                        this.setState({ selectedTypeName: t && t.name })
                    }
                />
            );

        const dataDiv =
            leftPaneTab === "predicates"
                ? renderSchemaTable()
                : renderTypesTable();

        const rightPane =
            leftPaneTab === "predicates" ? (
                <PredicateTabs
                    executeQuery={this.executeSchemaQuery}
                    onAfterDrop={this.fetchSchema}
                    onAfterUpdate={this.handleAfterUpdate}
                    onOpenGeneratedQuery={onOpenGeneratedQuery}
                    predicate={selectedPredicate}
                />
            ) : selectedType ? (
                <TypeProperties
                    type={selectedType}
                    onEdit={this.handleEditSelectedType}
                />
            ) : (
                <div>Please select a type.</div>
            );

        return (
            <div className="schema-view">
                <h2>Schema</h2>
                {alertDiv}
                <VerticalPanelLayout
                    defaultRatio={0.5}
                    first={
                        <React.Fragment>
                            {this.renderToolbar()}
                            {dataDiv}
                        </React.Fragment>
                    }
                    second={rightPane}
                />

                {this.renderModalComponent()}
            </div>
        );
    }
}

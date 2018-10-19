import React from "react";
import ReactDataGrid from "react-data-grid";
import _ from "lodash";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";
import TimeAgo from "react-timeago";

import SampleDataPanel from "./SampleDataPanel";
import SchemaDropAllModal from "./SchemaDropAllModal";
import SchemaPredicateModal from "./SchemaPredicateModal";
import PanelLayout from "./PanelLayout";
import PredicatePropertiesPanel from "./PredicatePropertiesPanel";

import { executeQuery, checkStatus, getEndpoint } from "../lib/helpers";

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

const isUserPredicate = name =>
    name !== "_predicate_" && name !== "_share_" && name !== "_share_hash_";

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
                width: 200,
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
        const comparer = (a, b) => {
            const sortDir = sortDirection === "ASC" ? 1 : -1;

            const aValue = React.isValidElement(a[sortColumn])
                ? a[sortColumn].props.datasortkey
                : a[sortColumn];
            const bValue = React.isValidElement(b[sortColumn])
                ? b[sortColumn].props.datasortkey
                : b[sortColumn];

            return aValue > bValue ? sortDir : -sortDir;
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

    showModal = () => {
        this.setState({
            modalKey: this.modalKey++,
        });
    };

    handleNewPredicateClick = () => {
        this.setState({
            showCreateDialog: true,
            showDropAllDialog: false,
        });
        this.showModal();
    };

    handleDropAllClick = () => {
        this.setState({
            showCreateDialog: false,
            showDropAllDialog: true,
        });
        this.showModal();
    };

    handleModalClose = () =>
        this.setState({
            showDropAllDialog: false,
            showCreateDialog: false,
        });

    handleAfterDropAll = () => {
        this.fetchSchema();
        this.handleModalClose();
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
        this.handleModalClose();
    };

    async executeSchemaQuery(query, method, debug) {
        const { onUpdateConnectedState, url } = this.props;
        let serverReplied = false;

        try {
            const res = await executeQuery(url, query, method, true);
            serverReplied = true;

            if (res.errors) {
                throw { serverErrorMessage: res.errors[0].message };
            }

            return res;
        } catch (error) {
            if (error.serverErrorMessage) {
                // This is an error thrown from above. Rethrow.
                throw error.serverErrorMessage;
            }
            // If no response, it's a network error or client side runtime error.
            const errorText = error.response
                ? await error.response.text()
                : error.message;

            throw `Could not connect to the server: ${errorText}`;
        } finally {
            onUpdateConnectedState(serverReplied);
        }
    }

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
        const { modalKey, showCreateDialog, showDropAllDialog } = this.state;

        if (showCreateDialog) {
            return (
                <SchemaPredicateModal
                    key={modalKey}
                    create={true}
                    predicate={{}}
                    onAfterUpdate={this.handleAfterUpdatePredicate}
                    executeQuery={this.executeSchemaQuery.bind(this)}
                    onCancel={this.handleModalClose}
                />
            );
        } else if (showDropAllDialog) {
            return (
                <SchemaDropAllModal
                    key={modalKey}
                    executeQuery={this.executeSchemaQuery.bind(this)}
                    onAfterDropAll={this.handleAfterDropAll}
                    onCancel={this.handleModalClose}
                />
            );
        }
        return null;
    };

    renderToolbar = () => {
        const { fetchState, lastUpdated } = this.state;
        return (
            <div className="btn-toolbar" key="buttonsDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleNewPredicateClick}
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
                {!lastUpdated ? null : (
                    <span
                        style={{
                            color: "#888888",
                            display: "inline-block",
                            padding: "6px 0 0 4px",
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
                            executeQuery={this.executeSchemaQuery.bind(this)}
                            onAfterUpdate={this.fetchSchema}
                            onAfterDrop={this.handleAfterDropSelectedPredicate}
                        />
                    )}
                </Tab>
                <Tab
                    eventKey="data"
                    title="Samples & Statistics"
                    className="auto-grow"
                >
                    {!rows || selectedIndex < 0 ? null : (
                        <SampleDataPanel
                            key={JSON.stringify(rows[selectedIndex].predicate)}
                            predicate={rows[selectedIndex].predicate}
                            executeQuery={this.executeSchemaQuery.bind(this)}
                            onOpenGeneratedQuery={onOpenGeneratedQuery}
                        />
                    )}
                </Tab>
            </Tabs>
        );

        return (
            <div className="schema-view">
                {alertDiv}
                <PanelLayout
                    defaultRatio={0.618}
                    disableHorizontal={true}
                    first={[this.renderToolbar(), dataDiv]}
                    second={rightPane}
                    title="Schema"
                />

                {this.renderModalComponent()}
            </div>
        );
    }
}

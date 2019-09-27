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
import ReactDataGrid from "react-data-grid";

import { getPredicateTypeString } from "../../lib/dgraph-syntax";
import { isUserPredicate } from "../../lib/dgraph-syntax";
import { executeQuery } from "../../lib/helpers";
import PanelLayout from "../PanelLayout";
import PathDisplay from "./PathDisplay";
import SamplesTable from "../schema/SampleDataPanel/SamplesTable";

import "./index.scss";

export default class DataExplorer extends React.Component {
    state = {
        schema: null,
        schemaCounts: {},
        lastUpdated: null,
        selectedPredicate: null,
        path: [],
    };

    dataGrid = React.createRef();
    gridContainer = React.createRef();

    columns = [
        {
            key: "name",
            name: "Predicate",
            resizable: true,
        },
        {
            key: "type",
            name: "Type",
            resizable: true,
        },
        {
            key: "count",
            name: "Count",
            resizable: true,
        },
    ];

    componentDidMount() {
        this.updateSchema();
        this.countsIntervalId = this.updateSchemaCounts();

        this.resizeInterval = setInterval(() => {
            if (!this.gridContainer.current) {
                return;
            }
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
        }, 600);
    }

    componentWillUnmount() {
        clearInterval(this.resizeInterval);
        clearInterval(this.countsIntervalId);
    }

    async updateSchema() {
        try {
            const schemaResponse = await this.executeQuery(
                "schema {}",
                "query",
            );

            this.setState({
                schema: schemaResponse.data.schema.filter(p =>
                    isUserPredicate(p.predicate),
                ),
                updateIndex: 0,
            });
        } catch (error) {
            // TODO error handling
            console.warn("Unable to fetch schema", error);
        }
    }

    async updatePredicate(pName) {
        const res = await this.executeQuery(
            `{
            count(func: has(<${pName}>)) {
              total: count(uid)
            }
        }`,
            "query",
        );
        this.setState({
            schemaCounts: Object.assign({}, this.state.schemaCounts, {
                [pName]: res.data.count[0].total,
            }),
        });
    }

    async updateSchemaCounts() {
        return window.setInterval(() => {
            let { schema, updateIndex: index } = this.state;
            let count = 4;

            while (schema && index < schema.length && count > 0) {
                this.updatePredicate(schema[index].predicate);
                count--;
                index++;
            }
            this.setState({ updateIndex: index });
        }, 2000);
    }

    executeQuery = async (query, action) => {
        const { url } = this.props;

        try {
            const res = await executeQuery(url.url, query, {
                action,
                debug: true,
            });

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
            // onUpdateConnectedState(serverReplied);
        }
    };

    pushPath(type, payload) {
        const { path } = this.state;
        this.setState({
            path: path.concat({
                type,
                ...payload,
            }),
        });
    }

    onRowClicked = index => {
        const { schema } = this.state;
        if (index < 0) {
            return;
        }
        const predicate = schema[index].predicate;
        this.setState({
            selectedPredicateName: predicate,
            selectedIndex: index,
            path: [{ type: "predicate", predicate }],
        });
    };

    refreshGrid = () => {
        this.dataGrid.current && this.dataGrid.current.metricsUpdated();
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 50);
    };

    onExploreProp = (uid, prop) => this.pushPath("nodeProp", { uid, prop });

    render() {
        const {
            schema,
            schemaCounts,
            selectedPredicateName,
            path,
        } = this.state;

        const rowGetter = idx => {
            if (!schema || idx >= schema.length || !schema[idx]) {
                return {};
            }
            const p = schema[idx];
            return {
                name: p.predicate,
                count: schemaCounts[p.predicate],
                type: getPredicateTypeString(p),
            };
        };

        const gridComponent = (
            <div className="grid-container" ref={this.gridContainer}>
                <ReactDataGrid
                    columns={this.columns}
                    ref={this.dataGrid}
                    minHeight={this.state.gridHeight}
                    rowsCount={schema ? schema.length : 0}
                    rowGetter={rowGetter}
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

        const second = selectedPredicateName ? (
            [
                <div key="path" className="path">
                    <PathDisplay
                        path={path}
                        onPopState={depth =>
                            this.setState({
                                path: path.slice(0, -depth),
                            })
                        }
                    />
                </div>,
                <SamplesTable
                    key={JSON.stringify(path)}
                    predicate={path[path.length - 1].predicate}
                    uid={path[path.length - 1].uid}
                    prop={path[path.length - 1].prop}
                    executeQuery={this.executeQuery}
                    onExploreProp={this.onExploreProp}
                />,
            ]
        ) : (
            <div className="well">
                Please select a predicate from the list on the left
            </div>
        );

        return (
            <PanelLayout
                defaultRatio={0.3}
                disableHorizontal={true}
                title="Data Explorer (experimental)"
                first={gridComponent}
                second={second}
                onAfterResize={this.refreshGrid}
            />
        );
    }
}

/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import ReactDataGrid from "react-data-grid"
import { Button } from "react-bootstrap"

import { getPredicateTypeString } from "lib/dgraph-syntax"
import { isUserPredicate } from "lib/dgraph-syntax"
import { executeQuery } from "lib/helpers"
import PanelLayout from "../PanelLayout"
import PathDisplay from "./PathDisplay"
import SamplesTable from "../schema/SampleDataPanel/SamplesTable"

import "./index.scss"

export default class DataExplorer extends React.Component {
    state = {
        schema: null,
        schemaCounts: {},
        lastUpdated: null,
        selectedPredicate: null,
        path: [],
        loadingCounts: {},
    }

    dataGrid = React.createRef()
    gridContainer = React.createRef()

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
            formatter: ({ value: name }) => {
                const { loadingCounts, schemaCounts } = this.state
                const count = schemaCounts[name]

                const getPredicateCount = (e) => {
                    e.stopPropagation()
                    this.updatePredicate(name)
                    this.setState({
                        loadingCounts: Object.assign({}, loadingCounts, {
                            [name]: true,
                        }),
                    })
                }

                if (count) {
                    return <span>{count}</span>
                } else {
                    return (
                        <Button
                            className="px-2"
                            size="sm"
                            onClick={getPredicateCount}
                            disabled={loadingCounts[name]}
                        >
                            Fetch count
                        </Button>
                    )
                }
            },
        },
    ]

    componentDidMount() {
        this.updateSchema()

        this.resizeInterval = setInterval(() => {
            if (!this.gridContainer.current) {
                return
            }
            const height = this.gridContainer.current.offsetHeight
            const width = this.gridContainer.current.offsetWidth
            if (height !== this.state.gridHeight || width !== this.state.gridWidth) {
                this.setState(
                    {
                        gridHeight: height,
                        gridWidth: width,
                    },
                    () => this.dataGrid.current.metricsUpdated(),
                )
            }
        }, 600)
    }

    componentWillUnmount() {
        clearInterval(this.resizeInterval)
    }

    async updateSchema() {
        try {
            const schemaResponse = await this.executeQuery("schema {}", "query")

            this.setState({
                schema: schemaResponse.data.schema.filter((p) => isUserPredicate(p.predicate)),
                updateIndex: 0,
            })
        } catch (error) {
            // TODO error handling
            console.warn("Unable to fetch schema", error)
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
        )
        this.setState({
            schemaCounts: Object.assign({}, this.state.schemaCounts, {
                [pName]: res.data.count[0].total,
            }),
        })
    }

    executeQuery = async (query, action) => {
        try {
            const res = await executeQuery(query, {
                action,
                debug: true,
            })

            if (res.errors) {
                throw { serverErrorMessage: res.errors[0].message }
            }

            return res
        } catch (error) {
            if (error.serverErrorMessage) {
                // This is an error thrown from above. Rethrow.
                throw error.serverErrorMessage
            }
            // If no response, it's a network error or client side runtime error.
            const errorText = error.response ? await error.response.text() : error.message

            throw `Could not connect to the Alpha: ${errorText}`
        } finally {
            // onUpdateConnectedState(serverReplied);
        }
    }

    pushPath(type, payload) {
        const { path } = this.state
        this.setState({
            path: path.concat({
                type,
                ...payload,
            }),
        })
    }

    onRowClicked = (index) => {
        const { schema } = this.state
        if (index < 0) {
            return
        }
        const predicate = schema[index].predicate
        this.setState({
            selectedPredicateName: predicate,
            selectedIndex: index,
            path: [{ type: "predicate", predicate }],
        })
    }

    refreshGrid = () => {
        this.dataGrid.current && this.dataGrid.current.metricsUpdated()
        setTimeout(() => {
            window.dispatchEvent(new Event("resize"))
        }, 50)
    }

    onExploreProp = (uid, prop) => this.pushPath("nodeProp", { uid, prop })

    render() {
        const { schema, selectedPredicateName, path } = this.state

        const rowGetter = (idx) => {
            if (!schema || idx >= schema.length || !schema[idx]) {
                return {}
            }
            const p = schema[idx]
            return {
                name: p.predicate,
                count: p.predicate, // A bit of a hacky solution since I can't find any documentation of react-grid 4.X.X
                type: getPredicateTypeString(p),
            }
        }

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
        )

        const second = selectedPredicateName ? (
            [
                <div key="path" className="path">
                    <PathDisplay
                        path={path}
                        onPopState={(depth) =>
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
            <div className="well">Please select a predicate from the list on the left</div>
        )

        return (
            <PanelLayout
                defaultRatio={0.3}
                disableHorizontal={true}
                title="Data Explorer (experimental)"
                first={gridComponent}
                second={second}
                onAfterResize={this.refreshGrid}
            />
        )
    }
}

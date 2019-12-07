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

import AutosizeGrid from "components/AutosizeGrid";
import { isAclPredicate } from "../../lib/dgraph-syntax";

const ACL_READ = 4;
const ACL_WRITE = 2;
const ACL_MODIFY = 1;

export default class GroupDetailsPane extends React.Component {
    handleDeleteGroup = async () => {
        const { executeMutation, onRefresh, group } = this.props;
        if (
            !window.confirm(
                `Are you sure you want to delete group "${group.xid}"?`,
            )
        ) {
            return;
        }
        await executeMutation(`{
          delete {
            <${group.uid}> * * .
          }
        }`);
        onRefresh();
    };

    /*
     * Filters predicates and returns only ACL predicates
     * @return - Array of filtered ACL predicates
     */
    getFilteredACLPredicates = () => {
        const { predicates } = this.props;

        return predicates.filter(p => isAclPredicate(p.predicate));
    };

    /*
     * Checks whether this predicate exists and if it is selected
     * @param predicate - predicate to check
     * @param mask - mask to check
     * @return - Booleans, whether this predicate exists and if it is selected
     */
    getPredicateACLStatus = (predicate, mask) => {
        const { group } = this.props;

        const existing = group.acl.find(x => x.predicate === predicate);
        const selected = !!existing && !!(existing.perm & mask);

        return { existing, selected };
    };

    /*
     * Toggles ACL for this predicate
     * @param predicate - predicate to toggle ACL for
     */
    toggleACL = (predicate, mask) => {
        const { group } = this.props;
        const { existing, selected } = this.getPredicateACLStatus(
            predicate,
            mask,
        );

        if (!existing) {
            group.acl.push({
                predicate: predicate,
                perm: mask,
            });
        } else {
            existing.perm += !selected ? mask : -mask;
        }
    };

    /*
     * Saves ACL for this group
     */
    saveACL = () => {
        const { group, saveNewAcl } = this.props;
        saveNewAcl && saveNewAcl(group, group.acl);
    };

    /*
     * Returns grid data for ACL predicates
     * @return - Array of objects used to create grid
     */
    getGridData = time => {
        const predicates = this.getFilteredACLPredicates();

        const getToggler = (p, mask) => {
            const { selected } = this.getPredicateACLStatus(p, mask);
            return {
                name: p,
                selected,
                toggle: () => {
                    this.toggleACL(p, mask);
                    this.saveACL();
                },
            };
        };

        return predicates.map(p => ({
            name: p.predicate,
            [`read${time}`]: getToggler(p.predicate, ACL_READ),
            [`modify${time}`]: getToggler(p.predicate, ACL_MODIFY),
            [`write${time}`]: getToggler(p.predicate, ACL_WRITE),
        }));
    };

    /*
     * Renders the header with a 'Select All' checkbox
     * @return - Function to render the header
     */
    getHeaderRenderer = mask => {
        return ({ column }) => {
            const predicates = this.getFilteredACLPredicates().map(
                p => p.predicate,
            );
            const selectMode = predicates.every(
                p => this.getPredicateACLStatus(p, mask).selected,
            );

            // Toggle all visible predicates
            const toggleAll = () => {
                predicates.forEach(p => {
                    const { selected } = this.getPredicateACLStatus(p, mask);

                    if (selected == selectMode) {
                        this.toggleACL(p, mask);
                    }
                });

                this.saveACL();
                this.forceUpdate();
            };

            return (
                <span>
                    <input
                        className="mr-1"
                        type="checkbox"
                        checked={selectMode}
                        onChange={toggleAll}
                    />
                    {column.name}
                </span>
            );
        };
    };

    render() {
        const { group } = this.props;
        const time = Date.now();

        const gridData = this.getGridData(time);
        const headerRenderer = this.getHeaderRenderer;

        const checkboxFormatter = cell => (
            <input
                type="checkbox"
                checked={cell.value.selected}
                onChange={cell.value.toggle}
            />
        );

        const columns = [
            {
                key: "name",
                name: "Predicate",
                resizable: true,
            },
            {
                key: "read" + time,
                name: "Read",
                resizable: true,
                width: 85,
                formatter: checkboxFormatter,
                headerRenderer: headerRenderer(ACL_READ),
            },
            {
                key: "modify" + time,
                name: "Modify",
                resizable: true,
                width: 85,
                formatter: checkboxFormatter,
                headerRenderer: headerRenderer(ACL_MODIFY),
            },
            {
                key: "write" + time,
                name: "Write",
                resizable: true,
                width: 85,
                formatter: checkboxFormatter,
                headerRenderer: headerRenderer(ACL_WRITE),
            },
        ];

        return (
            <div className="details-pane-content">
                <h3 className="panel-title">Group: {group.xid}</h3>

                <div className="btn-toolbar">
                    {" "}
                    <button
                        className="btn btn-danger btn-sm"
                        style={{ float: "right" }}
                        onClick={this.handleDeleteGroup}
                    >
                        Delete Group
                    </button>
                </div>

                <AutosizeGrid
                    className="datagrid minimize"
                    columns={columns}
                    rowGetter={idx => (idx < 0 ? {} : gridData[idx])}
                    rowsCount={gridData.length}
                    rowSelection={{
                        showCheckbox: false,
                        selectBy: {
                            keys: {
                                rowKey: "xid",
                                values: [""],
                            },
                        },
                    }}
                    minHeight={gridData.length * 35 + 35}
                />
            </div>
        );
    }
}

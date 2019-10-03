// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import AutosizeGrid from "components/AutosizeGrid";
import { isUserPredicate } from "../../lib/dgraph-syntax";

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

    render() {
        const { group, predicates, saveNewAcl } = this.props;

        const getToggler = (p, mask) => {
            const existing = group.acl.find(x => x.predicate === p);
            const selected = !!existing && !!(existing.perm & mask);
            return {
                name: p,
                selected,
                toggle: () => {
                    if (!existing) {
                        group.acl.push({
                            predicate: p,
                            perm: mask,
                        });
                    } else {
                        existing.perm += !selected ? mask : -mask;
                    }
                    saveNewAcl && saveNewAcl(group, group.acl);
                },
            };
        };

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
                sortable: true,
            },
            {
                key: "read",
                name: "Read",
                resizable: true,
                sortable: true,
                width: 60,
                formatter: checkboxFormatter,
            },
            {
                key: "modify",
                name: "Modify",
                resizable: true,
                sortable: true,
                width: 60,
                formatter: checkboxFormatter,
            },
            {
                key: "write",
                name: "Write",
                resizable: true,
                sortable: true,
                width: 60,
                formatter: checkboxFormatter,
            },
        ];

        // TODO: refactor the dgraph.type check into an isAclPredicate() helper
        const gridData = Object.values(predicates)
            .filter(p => isUserPredicate(p.name) || p.name === "dgraph.type")
            .map(p =>
                Object.assign({}, p, {
                    read: getToggler(p.name, ACL_READ),
                    modify: getToggler(p.name, ACL_MODIFY),
                    write: getToggler(p.name, ACL_WRITE),
                }),
            );

        const grid = (
            <AutosizeGrid
                className="datagrid"
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
            />
        );

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

                {grid}
            </div>
        );
    }
}

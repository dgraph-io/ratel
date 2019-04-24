// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import ReactDataGrid from "react-data-grid";

export default class UserDetailsPane extends React.Component {
    render() {
        const { user, groups, changeUser } = this.props;
        console.log("User ", user, "Groups", groups);

        const groupColumns = [
            {
                key: "membership",
                name: " ",
                width: 40,
                resizable: true,
                sortable: true,
                formatter: cell => (
                    <input
                        type="checkbox"
                        checked={cell.value.checked}
                        onChange={cell.value.invert}
                    />
                ),
            },
            {
                key: "xid",
                name: "Group",
                resizable: true,
                sortable: true,
            },
            {
                key: "acl",
                name: "Predicates",
                resizable: true,
                sortable: true,
                formatter: ({ value: acl }) =>
                    acl.filter(acl => acl.perm).length,
            },
        ];

        const grps = Object.values(groups).map(g => g.uid);

        const isUsersGroup = groupToCheck => {
            if (user.groups.find(g => g.uid === groupToCheck.uid)) {
                console.log(groupToCheck.xid, "in user", user);
                return true;
            } else {
                console.log(user.xid, "not in", groupToCheck.xid);
                return false;
            }
        };

        const gridData = Object.values(groups).map(g =>
            Object.assign({}, g, {
                membership: {
                    checked: isUsersGroup(g),
                    invert: () => changeUser(!isUsersGroup(g), user, g),
                },
            }),
        );

        const onGroupClicked = row => {
            this.setState({
                selectedGroup: row.xid,
            });
        };

        const grid = (
            <ReactDataGrid
                columns={groupColumns}
                rowGetter={idx => (idx < 0 ? {} : gridData[idx])}
                rowsCount={gridData.length}
                minHeight={300}
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
            <div>
                <h3>User: {user.xid}</h3>
                {grid}
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
        );
    }
}

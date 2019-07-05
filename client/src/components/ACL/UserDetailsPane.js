// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import AutosizeGrid from "components/AutosizeGrid";
import EditUserModal from "./EditUserModal";

export default class UserDetailsPane extends React.Component {
    state = {
        showEditUserModal: false,
    };
    handleEditPassword = () => {
        this.setState({ showEditUserModal: true });
    };

    renderEditUserModal = () =>
        !this.state.showEditUserModal ? null : (
            <EditUserModal
                isCreate={false}
                userName={this.props.user.xid}
                userUid={this.props.user.uid}
                onCancel={() => this.setState({ showEditUserModal: false })}
                onDone={() => {
                    this.setState({ showEditUserModal: false });
                    this.props.onRefresh();
                }}
                executeMutation={this.props.executeMutation}
            />
        );

    handleDeleteUser = async () => {
        const { executeMutation, onRefresh, user } = this.props;
        if (!window.confirm(`Are you sure you want to delete "${user.xid}"?`)) {
            return;
        }
        await executeMutation(`{
        delete {
          <${user.uid}> * * .
        }
      }`);
        onRefresh();
    };

    render() {
        const { user, groups, changeUser } = this.props;

        const groupColumns = [
            {
                key: "membership",
                name: " ",
                width: 32,
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

        const isUsersGroup = groupToCheck =>
            !!user.groups.find(g => g.uid === groupToCheck.uid);

        const gridData = Object.values(groups)
            .slice()
            .sort((a, b) => (a.xid < b.xid ? -1 : 1))
            .map(g =>
                Object.assign({}, g, {
                    membership: {
                        checked: isUsersGroup(g),
                        invert: () => changeUser(!isUsersGroup(g), user, g),
                    },
                }),
            );

        const grid = (
            <AutosizeGrid
                className="datagrid"
                enableCellAutoFocus={false}
                enableCellSelect={false}
                columns={groupColumns}
                rowGetter={idx => (idx < 0 ? {} : gridData[idx])}
                rowsCount={gridData.length}
            />
        );

        return (
            <div className="details-pane-content">
                <h3 className="panel-title">User: {user.xid}</h3>
                <div className="btn-toolbar">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={this.handleEditPassword}
                    >
                        Change Password
                    </button>
                    &nbsp;
                    <button
                        className="btn btn-danger btn-sm"
                        style={{ float: "right" }}
                        onClick={this.handleDeleteUser}
                    >
                        Delete User
                    </button>
                </div>
                {grid}
                {this.renderEditUserModal()}
            </div>
        );
    }
}

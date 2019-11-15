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

import memoize from "memoize-one";
import TimeAgo from "react-timeago";

import { executeQuery } from "../../lib/helpers.js";
import AutosizeGrid from "components/AutosizeGrid";
import EditGroupModal from "./EditGroupModal";
import EditUserModal from "./EditUserModal";
import GroupDetailsPane from "./GroupDetailsPane";
import UserDetailsPane from "./UserDetailsPane";
import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";

import "./AclPage.scss";

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

export default class AclPage extends React.Component {
    state = {
        fetchState: STATE_LOADING,
        groups: {},
        intialized: false,
        leftTab: "users",
        predicates: [],
        users: {},
    };

    mainQuery = `{
      users(func: has(dgraph.password)) {
        uid,
        xid: dgraph.xid,

    		userGroup: dgraph.user.group {
          uid,
          xid: dgraph.xid,
        }
      }

      groups(func: has(dgraph.xid)) {
        uid,
        xid: dgraph.xid,
        aclJson: dgraph.group.acl,
      }
    }`;

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        const prevToken = prevProps.url && prevProps.url.accessToken;
        const curToken = this.props.url && this.props.url.accessToken;
        if (prevToken !== curToken) {
            // This is needed to re-fetch every time login state changes.
            this.loadData();
        }
    }

    fetchQuery = async query => {
        this.setState({
            fetchState: STATE_LOADING,
        });
        let isError = false;

        try {
            const { url } = this.props;
            return await executeQuery(url.url, query, { action: "query" });
        } catch (e) {
            isError = true;
            throw e;
        } finally {
            this.setState({
                fetchState: isError ? STATE_ERROR : STATE_SUCCESS,
                lastUpdated: isError ? this.state.lastUpdated : new Date(),
            });
        }
    };

    sendMutation = async mutation => {
        this.setState({
            fetchState: STATE_LOADING,
        });
        let isError = false;

        try {
            const { url } = this.props;
            return await executeQuery(url.url, mutation, { action: "mutate" });
        } catch (e) {
            isError = true;
        } finally {
            this.setState({
                fetchState: isError ? STATE_ERROR : STATE_SUCCESS,
                lastUpdated: isError ? this.state.lastUpdated : new Date(),
            });
        }
    };

    modifyAcl = async (group, acl) => {
        // WARNING: double JSON.stringify is intentional.
        const resp = await this.sendMutation(`{
        set {
          <${group.uid}> <dgraph.group.acl> ${JSON.stringify(
            JSON.stringify(acl),
        )} .
        }
      }`);
        if (!resp || !resp.data || resp.data.code !== "Success") {
            alert(`Something went wrong, could not modify group ${group.xid}`);
        }
        await this.loadData();
    };

    changeUser = async (isAdd, user, group) => {
        const resp = await this.sendMutation(`{
        ${isAdd ? "set" : "delete"} {
          <${user.uid}> <dgraph.user.group> <${group.uid}> .
        }
      }`);
        if (!resp || !resp.data || resp.data.code !== "Success") {
            alert(`Something went wrong, could not modify user ${user.xid}`);
        }
        await this.loadData();
    };

    parseResponse = (data = { users: [], groups: [] }) => {
        const users = {};
        const groups = {};

        const getOrCreateGroup = (uid, xid) =>
            groups[uid] || (groups[uid] = { uid, xid, userCount: 0, acl: [] });

        const parseUserGroups = groups =>
            groups.map(({ uid, xid }) => getOrCreateGroup(uid, xid));

        data.users.forEach(({ uid, xid, userGroup }) => {
            users[uid] = {
                uid,
                xid,
                groups: parseUserGroups(userGroup || []),
            };
        });
        data.groups.forEach(({ uid, xid, aclJson }) => {
            if (users[uid]) {
                // This is a user, skip
                return;
            }
            getOrCreateGroup(uid, xid).acl = JSON.parse(aclJson || "[]");
        });

        Object.values(users).forEach(u =>
            u.groups.forEach(g => {
                g.userCount++;
            }),
        );

        return { users, groups };
    };

    parseSchema = schema =>
        schema.schema.reduce(
            (acc, p) =>
                Object.assign(acc, { [p.predicate]: { name: p.predicate } }),
            {},
        );

    loadData = async () => {
        // Fetch chema without blocking this function.
        (async () => {
            const schema = await this.fetchQuery("schema {}");
            this.setState({
                predicates: (schema && schema.data && schema.data.schema) || [],
            });
        })();

        const { selectedGroup, selectedUser } = this.state;

        try {
            const { data } = await this.fetchQuery(this.mainQuery);
            const { users, groups } = this.parseResponse(data);

            this.setState({
                users,
                groups,
                initialized: true,
                selectedGroup:
                    selectedGroup && selectedGroup.xid
                        ? Object.values(groups).find(
                              g => g.xid === selectedGroup.xid,
                          )
                        : null,
                selectedUser:
                    selectedUser && selectedUser.xid
                        ? Object.values(users).find(
                              u => u.xid === selectedUser.xid,
                          )
                        : null,
            });
        } catch (err) {
            this.setState({
                loadingError: JSON.stringify(
                    err && err.errors && err.errors[0],
                ),
            });
        }
    };

    userColumns = [
        {
            key: "xid",
            name: "User",
            resizable: true,
            sortable: true,
        },
        {
            key: "groups",
            name: "Groups",
            resizable: true,
            sortable: true,
        },
    ];

    formatUser = ({ xid, groups }) => ({
        xid: xid,
        groups:
            groups.length < 4
                ? groups.map(g => g.xid).join(", ")
                : groups
                      .map(g => g.xid)
                      .slice(0, 3)
                      .join(", ") + `and ${groups.length - 3} more`,
    });

    getTimeAgoWidget = () =>
        !this.state.lastUpdated ? null : (
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
                    date={this.state.lastUpdated}
                    formatter={timeAgoFormatter}
                    minPeriod={10}
                />
            </span>
        );

    handleNewUserClick = () => {
        this.setState({
            modal: "addUser",
        });
    };

    handleNewGroupClick = () => {
        this.setState({
            modal: "addGroup",
        });
    };

    executeModalMutation = async mutation => {
        try {
            const res = await this.sendMutation(mutation);

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
        }
    };

    renderModalComponent = () => {
        const { modal } = this.state;
        switch (modal) {
            case "addUser":
                return (
                    <EditUserModal
                        isCreate={true}
                        onCancel={() => this.setState({ modal: null })}
                        onDone={() => {
                            this.setState({ modal: null });
                            this.loadData();
                        }}
                        executeMutation={this.executeModalMutation}
                    />
                );

            case "addGroup":
                return (
                    <EditGroupModal
                        onCancel={() => this.setState({ modal: null })}
                        onDone={() => {
                            this.setState({ modal: null });
                            this.loadData();
                        }}
                        executeMutation={this.executeModalMutation}
                    />
                );

            default:
                return null;
        }
    };

    renderUsersToolbar = () => {
        const { fetchState } = this.state;
        return (
            <div className="btn-toolbar" key="buttonsDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleNewUserClick}
                >
                    Add User
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => this.setState({ leftTab: "users" })}
                >
                    <input
                        type="radio"
                        name="action"
                        checked={true}
                        onChange={() => this.setState({ leftTab: "users" })}
                    />
                    &nbsp;Users
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => this.setState({ leftTab: "groups" })}
                >
                    <input
                        className="btn btn-sm"
                        type="radio"
                        name="action"
                        checked={false}
                        onChange={() => this.setState({ leftTab: "groups" })}
                    />
                    &nbsp;Groups
                </button>

                <button
                    className="btn btn-default btn-sm"
                    disabled={fetchState === STATE_LOADING}
                    onClick={this.loadData}
                >
                    {fetchState === STATE_LOADING ? "Refreshing..." : "Refresh"}
                </button>
                {this.getTimeAgoWidget()}
            </div>
        );
    };

    renderGroupsToolbar = () => {
        const { fetchState } = this.state;
        return (
            <div className="btn-toolbar schema-toolbar" key="buttonsDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleNewGroupClick}
                >
                    Add Group
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => this.setState({ leftTab: "users" })}
                >
                    <input
                        type="radio"
                        name="action"
                        checked={false}
                        onChange={() => this.setState({ leftTab: "users" })}
                    />
                    &nbsp;Users
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => this.setState({ leftTab: "groups" })}
                >
                    <input
                        className="btn btn-sm"
                        type="radio"
                        name="action"
                        checked={true}
                        onChange={() => this.setState({ leftTab: "groups" })}
                    />
                    &nbsp;Groups
                </button>

                <button
                    className="btn btn-default btn-sm"
                    disabled={fetchState === STATE_LOADING}
                    onClick={this.loadData}
                >
                    {fetchState === STATE_LOADING ? "Refreshing..." : "Refresh"}
                </button>
                {this.getTimeAgoWidget()}
            </div>
        );
    };

    groupColumns = [
        {
            key: "xid",
            name: "Group",
            resizable: true,
            sortable: true,
        },
        {
            key: "userCount",
            name: "No. of Users",
            resizable: true,
            sortable: true,
        },
        {
            key: "acl",
            name: "Predicates",
            resizable: true,
            sortable: true,
            formatter: ({ value: acl }) => acl.filter(acl => acl.perm).length,
        },
    ];

    renderRightPanel(leftTab, obj) {
        if (!obj) {
            return <div />;
        }
        if (leftTab === "users" && obj) {
            return (
                <UserDetailsPane
                    user={obj}
                    groups={this.state.groups}
                    changeUser={this.changeUser}
                    executeMutation={this.executeModalMutation}
                    onRefresh={this.loadData}
                />
            );
        }
        if (leftTab === "groups" && obj) {
            return (
                <GroupDetailsPane
                    group={obj}
                    predicates={this.state.predicates}
                    saveNewAcl={this.modifyAcl}
                    executeMutation={this.executeModalMutation}
                    onRefresh={this.loadData}
                />
            );
        }
        return <pre>{JSON.stringify(obj, null, 2)}</pre>;
    }

    getUsersGridData = memoize((users, usersSortColumn, usersSortDirection) => {
        const gridData = Object.values(users);

        usersSortDirection = usersSortDirection || "ASC";
        usersSortColumn = usersSortColumn || "xid";
        const sortDir = usersSortDirection === "DESC" ? -1 : 1;

        gridData.sort((a, b) => {
            a = this.formatUser(a)[usersSortColumn];
            b = this.formatUser(b)[usersSortColumn];
            return a > b ? sortDir : -sortDir;
        });

        return gridData;
    });

    render() {
        const {
            initialized,
            groups,
            leftTab,
            loadingError,
            selectedUser,
            selectedGroup,
            users,
        } = this.state;

        let {
            groupsSortDirection,
            groupsSortColumn,
            usersSortColumn,
            usersSortDirection,
        } = this.state;

        let leftGrid = null;
        let leftToolbar = null;

        if (leftTab === "users") {
            leftToolbar = this.renderUsersToolbar();

            const gridData = this.getUsersGridData(
                users,
                usersSortColumn,
                usersSortDirection,
            );

            const handleSort = (column, direction) => {
                if (direction === "NONE") {
                    column = "xid";
                    direction = "ASC";
                }
                this.setState({
                    usersSortDirection: direction,
                    usersSortColumn: column,
                });
            };

            const onUserClicked = row => {
                this.setState({
                    selectedUser: row,
                });
            };

            leftGrid = (
                <AutosizeGrid
                    className="datagrid"
                    enableCellAutoFocus={false}
                    enableCellSelect={false}
                    columns={this.userColumns}
                    rowGetter={idx =>
                        idx < 0 ? {} : this.formatUser(gridData[idx])
                    }
                    rowsCount={gridData.length}
                    onGridSort={handleSort}
                    onRowClick={idx => idx >= 0 && onUserClicked(gridData[idx])}
                    rowSelection={{
                        showCheckbox: false,
                        selectBy: {
                            keys: {
                                rowKey: "xid",
                                values: [selectedUser && selectedUser.xid],
                            },
                        },
                    }}
                />
            );
        } else if (leftTab === "groups") {
            leftToolbar = this.renderGroupsToolbar();

            const gridData = Object.values(groups);

            groupsSortDirection = groupsSortDirection || "ASC";
            groupsSortColumn = groupsSortColumn || "xid";
            const sortDir = groupsSortDirection === "DESC" ? -1 : 1;

            gridData.sort((a, b) => {
                a = a[groupsSortColumn];
                b = b[groupsSortColumn];
                if (groupsSortColumn === "acl") {
                    a = a.length;
                    b = b.length;
                }
                return a > b ? sortDir : -sortDir;
            });

            const handleSort = (column, direction) => {
                if (direction === "NONE") {
                    column = "xid";
                    direction = "ASC";
                }
                this.setState({
                    groupsSortDirection: direction,
                    groupsSortColumn: column,
                });
            };

            const onGroupClicked = row => {
                this.setState({
                    selectedGroup: row,
                });
            };

            leftGrid = (
                <AutosizeGrid
                    className="datagrid"
                    columns={this.groupColumns}
                    rowGetter={idx => (idx < 0 ? {} : gridData[idx])}
                    rowsCount={gridData.length}
                    onGridSort={handleSort}
                    onRowClick={idx =>
                        idx >= 0 && onGroupClicked(gridData[idx])
                    }
                    rowSelection={{
                        showCheckbox: false,
                        selectBy: {
                            keys: {
                                rowKey: "xid",
                                values: [selectedGroup && selectedGroup.xid],
                            },
                        },
                    }}
                />
            );
        }

        const rightPanel = this.renderRightPanel(
            leftTab,
            leftTab === "users" ? selectedUser : selectedGroup,
        );

        const renderPanels = () => (
            <VerticalPanelLayout
                defaultRatio={0.5}
                first={
                    <React.Fragment>
                        <h3 className="panel-title">
                            Showing{" "}
                            {leftTab === "users"
                                ? `${Object.values(users).length} users`
                                : `${Object.values(groups).length} groups`}
                        </h3>
                        {leftToolbar}
                        {leftGrid}
                    </React.Fragment>
                }
                second={rightPanel}
            />
        );

        const renderInitMessage = () =>
            !loadingError ? (
                <div>Loading ACL Configuration...</div>
            ) : (
                <div>Error fetching ACL data: {loadingError}</div>
            );

        return (
            <div className="acl-view">
                <h2>Access Control</h2>
                {initialized ? renderPanels() : renderInitMessage()}
                {this.renderModalComponent()}
            </div>
        );
    }
}

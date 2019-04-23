// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import classnames from "classnames";
import ReactDataGrid from "react-data-grid";

import { checkStatus, getEndpoint } from "../../lib/helpers";

const STATE_LOADING = 0;
const STATE_SUCCESS = 1;
const STATE_ERROR = 2;

export default class AclPage extends React.Component {
    state = {
        leftTab: "users",
        users: {},
        groups: {},
        predicates: {},
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
            name: "Users",
            resizable: true,
            sortable: true,
        },
        {
            key: "predicates",
            name: "Predicates",
            resizable: true,
            sortable: true,
        },
    ];

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

    dataGrid = React.createRef();

    componentDidMount() {
        this.loadData();
    }

    fetchQuery = async query => {
        this.setState({
            fetchState: STATE_LOADING,
        });
        let isError = false;

        try {
            const { url } = this.props;
            const resp = await fetch(getEndpoint(url, "query"), {
                method: "POST",
                mode: "cors",
                body: query,
                credentials: "same-origin",
            });
            checkStatus(resp);
            return (await resp.json()).data;
        } catch (e) {
            isError = true;
        } finally {
            this.setState({
                fetchState: isError ? STATE_ERROR : STATE_SUCCESS,
                lastUpdated: isError ? this.state.lastUpdated : new Date(),
            });
        }
    };

    parseResponse = data => {
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

        Object.values(users).forEach(u => {
            u.predicateCount = 0;
            u.groups.forEach(g => {
                g.userCount++;
                console.log(u, " -> ", g);
                u.predicateCount += g.acl.length;
            });
        });

        return { users, groups };
    };

    parseSchema = schema => {
        const predicates = {};
        schema.schema.forEach(
            p => (predicates[p.predicate] = { name: p.predicate }),
        );
        return predicates;
    };

    loadData = async () => {
        const data = await this.fetchQuery(this.mainQuery);
        const { users, groups } = this.parseResponse(data);
        console.log("Got data: ", users, groups);

        this.setState({ users, groups });

        const schema = await this.fetchQuery("schema {}");
        console.log("schema = ", schema);
        this.setState({ predicates: this.parseSchema(schema) });
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
        {
            key: "predicateCount",
            name: "Predicates",
            resizable: true,
            sortable: true,
        },
    ];

    formatUser = ({ xid, groups, predicateCount }) => ({
        xid: xid,
        groups:
            groups.length < 4
                ? groups.map(g => g.xid).join(", ")
                : groups
                      .map(g => g.xid)
                      .slice(0, 3)
                      .join(", ") + `and ${groups.length - 3} more`,
        predicateCount,
    });

    renderToolbar() {}

    render() {
        const {
            gridHeight,
            groups,
            leftTab,
            predicates,
            selectedUser,
            selectedGroup,
            users,
        } = this.state;

        let { usersSortColumn, usersSortDirection } = this.state;

        let leftGrid = null;

        if (leftTab == "users") {
            const gridData = Object.values(users);

            usersSortDirection = usersSortDirection || "ASC";
            usersSortColumn = usersSortColumn || "xid";
            const sortDir = usersSortDirection === "ASC" ? 1 : -1;

            gridData.sort((a, b) => {
                a = this.formatUser(a)[usersSortColumn];
                b = this.formatUser(b)[usersSortColumn];
                return a > b ? sortDir : -sortDir;
            });

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
                    selectedUser: row.xid,
                });
            };

            leftGrid = (
                <ReactDataGrid
                    columns={this.userColumns}
                    ref={this.dataGrid}
                    rowGetter={idx =>
                        idx < 0 ? {} : this.formatUser(gridData[idx])
                    }
                    rowsCount={gridData.length}
                    minHeight={gridHeight}
                    onGridSort={handleSort}
                    onRowClick={idx => idx >= 0 && onUserClicked(gridData[idx])}
                    rowSelection={{
                        showCheckbox: false,
                        selectBy: {
                            keys: {
                                rowKey: "xid",
                                values: [selectedUser],
                            },
                        },
                    }}
                />
            );
        }

        const dataDiv = (
            <div
                className="grid-container"
                key="dataDiv"
                ref={this.gridContainer}
            >
                {leftGrid}
            </div>
        );

        return (
            <div>
                <h1>ACL</h1>
                {dataDiv}
            </div>
        );
    }
}

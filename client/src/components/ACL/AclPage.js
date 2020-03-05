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

import React, { useEffect, useState } from "react";

import memoize from "memoize-one";
import TimeAgo from "react-timeago";
import useInterval from "use-interval";

import AutosizeGrid from "components/AutosizeGrid";
import CreateGroupModal from "./CreateGroupModal";
import EditUserModal from "./EditUserModal";
import GroupDetailsPane from "./GroupDetailsPane";
import UserDetailsPane from "./UserDetailsPane";
import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";

import JsonDataAdapter, {
    STATE_ERROR,
    STATE_LOADING,
    STATE_SUCCESS,
} from "./JsonDataAdapter";

import "./AclPage.scss";

const userColumns = [
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

const groupColumns = [
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

const formatUser = ({ xid, groups, ...other }) => ({
    xid: xid,
    ...other,
    groups:
        groups.length < 4
            ? groups.map(g => g.xid).join(", ")
            : groups
                  .map(g => g.xid)
                  .slice(0, 3)
                  .join(", ") + `and ${groups.length - 3} more`,
});

function SortableGrid({
    rows,
    selection: [selectedXid, setSelectedXid],
    columns,
}) {
    const [sortColumn, setSortColumn] = useState("xid");
    const [sortDirection, setSortDirection] = useState("ASC");

    const getGridData = memoize((rows, usersSortColumn, usersSortDirection) => {
        const sortDir = usersSortDirection === "DESC" ? -1 : 1;
        rows = rows.slice();

        rows.sort((a, b) => {
            a = a[usersSortColumn];
            b = b[usersSortColumn];
            return a > b ? sortDir : -sortDir;
        });

        return rows;
    });

    const gridData = getGridData(rows, sortColumn, sortDirection);

    const handleSort = (column, direction) => {
        if (direction === "NONE") {
            column = "xid";
            direction = "ASC";
        }
        setSortColumn(column);
        setSortDirection(direction);
    };

    return (
        <AutosizeGrid
            className="datagrid"
            enableCellAutoFocus={false}
            enableCellSelect={false}
            columns={columns}
            rowGetter={idx => (idx < 0 ? {} : gridData[idx])}
            rowsCount={gridData.length}
            onGridSort={handleSort}
            onRowClick={idx => setSelectedXid(gridData[idx]?.xid)}
            rowSelection={{
                showCheckbox: false,
                selectBy: {
                    keys: {
                        rowKey: "xid",
                        values: [selectedXid],
                    },
                },
            }}
        />
    );
}

export default function AclPage({ url }) {
    const [fetchState, setFetchState] = useState(STATE_LOADING);

    const [groups, setGroups] = useState({});
    const [users, setUsers] = useState({});
    const [predicates, setPredicates] = useState([]);

    const [leftTab, setLeftTab] = useState("users");
    const [loadingError, setLoadingError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [modal, setModal] = useState(null);

    const [selectedUserXid, setSelectedUserXid] = useState(null);
    const [selectedGroupXid, setSelectedGroupXid] = useState(null);

    const [aclModel] = useState(
        JsonDataAdapter(
            url,
            [fetchState, setFetchState],
            [lastUpdated, setLastUpdated],
            [users, setUsers],
            [groups, setGroups],
            [predicates, setPredicates],
            [loadingError, setLoadingError],
        ),
    );

    useEffect(() => {
        aclModel.loadData();
    }, [url?.refreshToken]);

    useInterval(() => aclModel && aclModel.loadData(), 5000);

    const getTimeAgoWidget = () =>
        !lastUpdated ? null : (
            <span
                style={{
                    color: "#888",
                    display: "inline-block",
                    fontSize: 12,
                    padding: "8px 0 0 8px",
                }}
            >
                Updated&nbsp;
                <TimeAgo date={lastUpdated} minPeriod={10} />
            </span>
        );

    const handleNewUserClick = () => setModal("addUser");

    const renderModalComponent = () => {
        switch (modal) {
            case "addUser":
                return (
                    <EditUserModal
                        isCreate={true}
                        onCancel={() => setModal(null)}
                        onDone={() => {
                            setModal(null);
                            aclModel.loadData();
                        }}
                        saveUser={aclModel.saveUser}
                    />
                );

            case "addGroup":
                return (
                    <CreateGroupModal
                        onCancel={() => setModal(null)}
                        onDone={() => {
                            setModal(null);
                            aclModel.loadData();
                        }}
                        createGroup={aclModel.createGroup}
                    />
                );

            default:
                return null;
        }
    };

    const renderUsersToolbar = () => {
        return (
            <div className="btn-toolbar" key="buttonsDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleNewUserClick}
                >
                    Add User
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => setLeftTab("users")}
                >
                    <input
                        type="radio"
                        name="action"
                        checked={true}
                        onChange={() => setLeftTab("users")}
                    />
                    &nbsp;Users
                </button>

                <button
                    className="btn btn-sm"
                    onClick={() => setLeftTab("groups")}
                >
                    <input
                        className="btn btn-sm"
                        type="radio"
                        name="action"
                        checked={false}
                        onChange={() => setLeftTab("groups")}
                    />
                    &nbsp;Groups
                </button>

                <button
                    className="btn btn-default btn-sm"
                    disabled={fetchState === STATE_LOADING}
                    onClick={aclModel.loadData}
                >
                    {fetchState === STATE_LOADING ? "Refreshing..." : "Refresh"}
                </button>
                {getTimeAgoWidget()}
            </div>
        );
    };

    const renderGroupsToolbar = () => (
        <div className="btn-toolbar schema-toolbar" key="buttonsDiv">
            <button
                className="btn btn-primary btn-sm"
                onClick={() => setModal("addGroup")}
            >
                Add Group
            </button>

            <button className="btn btn-sm" onClick={() => setLeftTab("users")}>
                <input
                    type="radio"
                    name="action"
                    checked={false}
                    onChange={() => setLeftTab("users")}
                />
                &nbsp;Users
            </button>

            <button className="btn btn-sm" onClick={() => setLeftTab("groups")}>
                <input
                    className="btn btn-sm"
                    type="radio"
                    name="action"
                    checked={true}
                    onChange={() => setLeftTab("groups")}
                />
                &nbsp;Groups
            </button>

            <button
                className="btn btn-default btn-sm"
                disabled={fetchState === STATE_LOADING}
                onClick={aclModel.loadData}
            >
                {fetchState === STATE_LOADING ? "Refreshing..." : "Refresh"}
            </button>
            {getTimeAgoWidget()}
        </div>
    );

    const renderRightPanel = (leftTab, obj) => {
        if (!obj) {
            return <div />;
        }
        if (leftTab === "users" && obj) {
            return (
                <UserDetailsPane
                    user={obj}
                    groups={groups}
                    changeUser={aclModel.changeUser}
                    onRefresh={aclModel.loadData}
                    saveUser={aclModel.saveUser}
                    deleteUser={aclModel.deleteUser}
                />
            );
        }
        if (leftTab === "groups" && obj) {
            return (
                <GroupDetailsPane
                    group={obj}
                    predicates={predicates}
                    saveGroupAcl={aclModel.saveGroupAcl}
                    deleteGroup={aclModel.deleteGroup}
                    onRefresh={aclModel.loadData}
                />
            );
        }
        return <pre>{JSON.stringify(obj, null, 2)}</pre>;
    };

    const leftToolbar =
        leftTab === "users" ? renderUsersToolbar() : renderGroupsToolbar();
    const leftGrid =
        leftTab === "users" ? (
            <SortableGrid
                rows={Object.values(users).map(formatUser)}
                selection={[selectedUserXid, setSelectedUserXid]}
                columns={userColumns}
            />
        ) : (
            <SortableGrid
                rows={Object.values(groups)}
                selection={[selectedGroupXid, setSelectedGroupXid]}
                columns={groupColumns}
            />
        );

    const rightPanel = renderRightPanel(
        leftTab,
        leftTab === "users"
            ? Object.values(users).find(u => u?.xid === selectedUserXid)
            : Object.values(groups).find(g => g?.xid === selectedGroupXid),
    );

    const renderPanels = () => (
        <VerticalPanelLayout
            defaultRatio={0.5}
            first={
                <>
                    <h3 className="panel-title">
                        Showing{" "}
                        {leftTab === "users"
                            ? `${Object.values(users).length} users`
                            : `${Object.values(groups).length} groups`}
                    </h3>
                    {leftToolbar}
                    {leftGrid}
                </>
            }
            second={rightPanel}
        />
    );

    const maybeShowError = () => {
        if (!loadingError) {
            return null;
        }
        if (JSON.stringify(loadingError).includes("only groot is allowed")) {
            return (
                <div className="alert alert-danger">
                    You need to login as <strong>groot</strong> to see ACL
                    settings.
                </div>
            );
        }
        return (
            <div className="alert alert-danger">
                Error fetching ACL data: {loadingError}
            </div>
        );
    };

    return (
        <div className="acl-view">
            <h2>Access Control</h2>
            {maybeShowError()}
            {renderPanels()}
            {renderModalComponent()}
        </div>
    );
}

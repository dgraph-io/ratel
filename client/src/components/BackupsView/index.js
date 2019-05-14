// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import { checkStatus, getEndpoint } from "../../lib/helpers";
import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import sortDataGrid from "../../lib/sortDataGrid";

import BackupList from "./BackupList";
import BusyIndicatorModal from "./BusyIndicatorModal";
import BackupFormModal from "./BackupFormModal";
import { MESSAGE_TYPE, MESSAGES } from "./Backups.const";

import "./BackupsView.scss";

export default class BackupsView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            backupList: this.getInitialBackupList(),
            messageText: "",
            messageType: "",
            showBackupDialog: false,
            requiredPath: false,
            busyIndicatorStatus: false,
            busyIndicatorMsg: "",
        };
    }

    getColumns = () => {
        return [
            {
                key: "timestamp",
                name: "Time stamp",
                sortable: true,
                width: 210,
            },
            {
                key: "location",
                name: "Location",
                sortable: false,
                width: 375,
            },
        ];
    };
    getInitialBackupList = () => {
        const backupList = localStorage.getItem("backupList");
        return backupList ? JSON.parse(backupList) : [];
    };

    getDateTime = () => {
        const today = new Date();
        const date =
            today.getMonth() +
            1 +
            "/" +
            today.getDate() +
            "/" +
            today.getFullYear();
        const time =
            today.getHours() +
            ":" +
            today.getMinutes() +
            ":" +
            today.getSeconds();
        return date + " " + time;
    };
    createBackup = path => {
        this.setState({
            busyIndicatorStatus: true,
            busyIndicatorMsg: MESSAGES.BACKUP_IN_PROGRESS,
        });
        const formData = new FormData();
        formData.append("destination", path);

        const { url } = this.props;
        fetch(getEndpoint(url, "admin/backup"), {
            method: "POST",
            mode: "cors",
            credentials: "same-origin",
            body: formData,
        })
            .then(checkStatus)
            .then(res => res.json())
            .then(result => {
                if (result.errors) {
                    const msg = this.extractErrorMessage(result.errors);
                    this.setState(
                        this.getMessageObj(false, MESSAGE_TYPE.ERROR, msg),
                    );
                } else {
                    this.handleBackupSuccess(path);
                }
            })
            .catch(error => {
                const valObj = this.getMessageObj(
                    false,
                    MESSAGE_TYPE.ERROR,
                    MESSAGES.BACKUP_ERROR,
                );
                this.setState(valObj);
            });
    };

    handleBackupSuccess(path) {
        const backupList = this.state.backupList;
        const backupObject = {
            timestamp: this.getDateTime(),
            location: path,
        };
        backupList.push(backupObject);
        const msgObject = this.getMessageObj(
            false,
            MESSAGE_TYPE.INFO,
            MESSAGES.BACKUP_SUCCESS,
        );
        // store in local storage
        localStorage.setItem("backupList", JSON.stringify(backupList));
        this.setState({
            ...msgObject,
            backupList: backupList,
        });
    }

    extractErrorMessage(result) {
        if (result) {
            return result[0].message + " " + result[0].code;
        }
        return this.messageText.BACKUP_ERROR;
    }

    getMessageObj(indicatorType, msgType, msgText) {
        return {
            busyIndicatorStatus: indicatorType,
            messageType: msgType,
            messageText: msgText,
        };
    }

    handleBackupClick = () => this.showModal("showBackupDialog");

    handleBackupSave = path => {
        if (path.length > 0) {
            this.setState({
                showBackupDialog: false,
                requiredPath: false,
            });
            this.createBackup(path);
        } else {
            this.setState({
                requiredPath: true,
            });
        }
    };
    handleCloseModal = () =>
        this.setState({
            showBackupDialog: false,
            showDeleteDialog: false,
        });

    handleSort = (sortColumn, sortDirection) => {
        const backupList = sortDataGrid(
            sortColumn,
            sortDirection,
            this.state.backupList,
        );
        this.setState({ backupList });
    };

    showModal = modalType => {
        this.setState({
            showBackupDialog: false,
            showDeleteDialog: false,
            [modalType]: true,
        });
    };
    renderModalComponent = () => {
        const {
            showBackupDialog,
            busyIndicatorStatus,
            busyIndicatorMsg,
            requiredPath,
        } = this.state;
        if (showBackupDialog) {
            return (
                <BackupFormModal
                    onHide={this.handleCloseModal}
                    handleBackupSave={this.handleBackupSave}
                    requirePath={requiredPath}
                />
            );
        }
        if (busyIndicatorStatus) {
            return (
                <BusyIndicatorModal
                    showStatus={busyIndicatorStatus}
                    message={busyIndicatorMsg}
                />
            );
        }
    };

    renderToolbarComponent(type, message) {
        const statusText = message ? (
            <span className={type}>{message}</span>
        ) : null;
        return (
            <>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleBackupClick}
                >
                    Take Backup
                </button>
                {statusText}
            </>
        );
    }

    renderBackupListViewComponent(backupList, columns) {
        if (backupList.length)
            return (
                <BackupList
                    key="servicesBackupList"
                    columns={columns}
                    data={backupList}
                    onSort={this.handleSort}
                />
            );
        else return <span>{MESSAGES.BACKUP_LIST_EMPTY} </span>;
    }

    render() {
        const { backupList, messageText, messageType } = this.state;
        const column = this.getColumns();
        return (
            <div className="backups-view">
                <h2 key="pageHeader">Backups</h2>
                <VerticalPanelLayout
                    defaultRatio={0.4}
                    first={[
                        <div className="toolbar" key="toolbarDiv">
                            {this.renderToolbarComponent(
                                messageType,
                                messageText,
                            )}
                        </div>,
                        <div className="grid-container" key="dataDiv">
                            {this.renderBackupListViewComponent(
                                backupList,
                                column,
                            )}
                        </div>,
                    ]}
                    second=""
                />
                {this.renderModalComponent()}
            </div>
        );
    }
}

// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import moment from "moment";
import AutosizeGrid from "../AutosizeGrid";

import { checkStatus, getEndpoint } from "../../lib/helpers";
import sortDataGrid from "../../lib/sortDataGrid";

import BusyIndicatorModal from "./BusyIndicatorModal";
import BackupFormModal from "./BackupFormModal";
import { MESSAGE_TYPE, MESSAGES } from "./Backups.const";

import "./BackupsView.scss";

export default class BackupsView extends React.Component {
    state = {
        messageText: "",
        messageType: "",
        showBackupDialog: false,
        path: "",
        busyIndicatorStatus: false,
        busyIndicatorMsg: "",
    };

    _columns = [
        {
            key: "timestamp",
            name: "Time stamp",
            sortable: false,
            width: 250,
        },
        {
            key: "location",
            name: "Location",
            sortable: false,
            width: 375,
        },
    ];

    createBackup = () => {
        const path = this.state.path;
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
        const backupObject = {
            timestamp: moment().format("MM-DD-YYYY HH:mm:ss"),
            location: path,
        };
        const msgObject = this.getMessageObj(
            false,
            MESSAGE_TYPE.INFO,
            MESSAGES.BACKUP_SUCCESS,
        );
        this.props.handleAddBackup(backupObject);
        this.setState({
            ...msgObject,
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

    handleBackupSave = () => {
        this.handleCloseModal();
        this.createBackup();
    };

    handleBackupPathChange = path =>
        this.setState({
            path: path,
        });

    handleCloseModal = () =>
        this.setState({
            showBackupDialog: false,
            showDeleteDialog: false,
        });

    showModal = modalType => {
        this.setState({
            showBackupDialog: false,
            showDeleteDialog: false,
            [modalType]: true,
        });
    };

    renderModalComponent = () => {
        const {
            path,
            showBackupDialog,
            busyIndicatorStatus,
            busyIndicatorMsg,
        } = this.state;

        if (showBackupDialog) {
            return (
                <BackupFormModal
                    path={path}
                    onHide={this.handleCloseModal}
                    handleBackupSave={this.handleBackupSave}
                    handleBackupPathChange={this.handleBackupPathChange}
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

    renderBackupListViewComponent(backups, columns) {
        if (backups.length)
            return (
                <AutosizeGrid
                    className="datagrid"
                    columns={columns}
                    rowGetter={i => backups[i]}
                    rowsCount={backups.length}
                    enableCellSelect={true}
                />
            );
        else return <span>{MESSAGES.BACKUP_LIST_EMPTY} </span>;
    }

    render() {
        const { messageText, messageType } = this.state;
        const columns = this._columns;
        return (
            <div className="backups-view">
                <h2 key="pageHeader">Backups</h2>
                <div className="toolbar" key="toolbarDiv">
                    {this.renderToolbarComponent(messageType, messageText)}
                </div>
                <div className="grid-container" key="dataDiv">
                    {this.renderBackupListViewComponent(
                        this.props.backups,
                        columns,
                    )}
                </div>
                {this.renderModalComponent()}
            </div>
        );
    }
}

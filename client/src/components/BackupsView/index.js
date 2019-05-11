// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import { checkStatus, getEndpoint } from "../../lib/helpers";
import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import sortDataGrid from "../../lib/sortDataGrid";

import BackupDetail from "./BackupDetail";
import BackupList from "./BackupList";
import BackupFormModal from "./BackupFormModal";
import BackupDeleteModal from "./BackupDeleteModal";

import "./BackupsView.scss";

const STATE_LOADING = 0;
const STATE_SUCCESS = 1;
const STATE_ERROR = 2;

export default class BackupsView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            selectedBackupItem: null,
            backupListState: STATE_LOADING,
            backupSaveState: STATE_SUCCESS,
            errorMsg: "",
            showBackupDialog: false,
            showDeleteDialog: false,
            backupSelectedOption: this.getDefaultBackupSelection(),
        };
    }

    getDefaultBackupSelection = () => {
        return {
            type: null,
            path: null,
        };
    };

    getDummyData = () => {
        return [
            {
                id: 15,
                timestamp: "05/06/2019 2:35 PM",
                size: 300,
                location: "Amazon S3",
                path: "s3://s3.us-west-2.amazonaws.com/bucketname1",
            },
            {
                id: 11,
                timestamp: "05/03/2019 1:35 PM",
                size: 40,
                location: "Minio",
                path: "minio://127.0.0.1:9000/bucketname1",
            },
            {
                id: 10,
                timestamp: "05/01/2019 5:35 PM",
                size: 20,
                location: "Local",
                path: "/usr/data/backup1",
            },
            {
                id: 8,
                timestamp: "04/29/2019 10:35 PM",
                size: 200,
                location: "Amazon S3",
                path: "s3://s3.us-west-2.amazonaws.com/bucketname2",
            },
            {
                id: 7,
                timestamp: "04/15/2019 6:35 PM",
                size: 40,
                location: "Minio",
                path: "minio://127.0.0.1:9000/bucketname2",
            },
            {
                id: 4,
                timestamp: "04/06/2019 9:35 PM",
                size: 20,
                location: "NFS",
                path: "/usr/data/backup2",
            },
        ];
    };

    getColumns = () => {
        return [
            {
                key: "id",
                name: "Id",
                sortable: true,
                width: 50,
            },
            {
                key: "timestamp",
                name: "Time stamp",
                sortable: true,
                width: 210,
            },
            {
                key: "size",
                name: "Size (mb)",
                sortable: true,
                width: 150,
            },
            {
                key: "path",
                name: "Location",
                sortable: false,
                width: 375,
            },
        ];
    };

    createBackup = path => {
        this.setState({
            backupSaveState: STATE_LOADING,
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
                this.setState({
                    backupSaveState: STATE_SUCCESS,
                });
            })
            .catch(error => {
                this.setState({
                    backupSaveState: STATE_ERROR,
                });
            });
    };

    fetchBackupList = () => {
        // TODO: make api call
        setTimeout(() => {
            const data = this.getDummyData();
            if (data) {
                this.setState({
                    data: data,
                    selectedBackupItem: null,
                    backupListState: STATE_SUCCESS,
                    errorMsg: "",
                });
            } else {
                this.setState({
                    data: null,
                    selectedBackupItem: null,
                    backupListState: STATE_ERROR,
                    errorMsg: "Unable to load backup list",
                });
            }
        }, 1000);
    };

    onSelectBackupItem = index => {
        if (index < 0) {
            return;
        }
        this.setState({
            selectedBackupItem: this.state.data[index],
        });
    };

    showModal = modalType => {
        this.setState({
            showBackupDialog: false,
            showDeleteDialog: false,
            [modalType]: true,
        });
    };

    handleBackupClick = () => this.showModal("showBackupDialog");

    handleBackupDeleteClick = () => this.showModal("showDeleteDialog");

    handleCloseModal = () =>
        this.setState({
            showBackupDialog: false,
            showDeleteDialog: false,
        });

    handleBackupDelete = () => {
        // TODO: make api call
        const selectedBackup = this.state.selectedBackupItem;
        if (selectedBackup) {
            const data = this.state.data.filter(
                item => item.id !== selectedBackup.id,
            );
            this.setState({
                data: data,
                selectedBackupItem: null,
                showDeleteDialog: false,
            });
        }
    };

    handleBackupRestore = e => {
        // TODO: make api call
    };

    handleBackupSave = path => {
        if (path.length > 0) {
            this.handleCloseModal();
            this.createBackup(path);
        } else {
            this.setState({
                requiredPath: true,
            });
        }
    };

    handleSort = (sortColumn, sortDirection) => {
        const data = sortDataGrid(sortColumn, sortDirection, this.state.data);
        this.setState({ data });
    };

    componentDidMount() {
        this.fetchBackupList();
    }
    renderModalComponent = () => {
        const { showBackupDialog, showDeleteDialog } = this.state;
        if (showBackupDialog) {
            return (
                <BackupFormModal
                    onHide={this.handleCloseModal}
                    handleBackupSave={this.handleBackupSave}
                />
            );
        }
        if (showDeleteDialog) {
            return (
                <BackupDeleteModal
                    onHide={this.handleCloseModal}
                    onDelete={this.handleBackupDelete}
                />
            );
        }
    };

    renderBackupButton() {
        return (
            <Button variant="primary" onClick={this.handleBackupClick}>
                Take Backup
            </Button>
        );
    }

    renderBackupInProgressButton() {
        return (
            <Button variant="primary" disabled>
                <Spinner
                    as="span"
                    animation="grow"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />
                Backup in progress...
            </Button>
        );
    }
    renderToolbarComponent(backupSaveState) {
        switch (backupSaveState) {
            case STATE_LOADING:
                return this.renderBackupInProgressButton();
            case STATE_ERROR:
                return (
                    <React.Fragment>
                        {this.renderBackupButton()}
                        <span className="error-text">
                            failed! please try again
                        </span>
                    </React.Fragment>
                );
            case STATE_SUCCESS:
            default:
                return this.renderBackupButton();
        }
    }

    renderBackupListViewComponent(status, data, columns) {
        if (status === STATE_LOADING) return <span>Loading...</span>;
        if (data.length)
            return (
                <BackupList
                    key="servicesBackupList"
                    columns={columns}
                    data={this.state.data}
                    onSelectBackupItem={this.onSelectBackupItem}
                    onSort={this.handleSort}
                />
            );
        else return <span>No backup available</span>;
    }

    renderBackupDetailViewComponent(selectedBackupItem, data) {
        const msg = data.length
            ? "Please select a backup from the list on the left"
            : "No backup to select";
        return selectedBackupItem ? (
            <BackupDetail
                data={selectedBackupItem}
                onDeleteClick={this.handleBackupDeleteClick}
                onRestoreClick={this.handleBackupRestore}
            />
        ) : (
            <span>{msg}</span>
        );
    }

    render() {
        const columns = this.getColumns();
        const {
            data,
            selectedBackupItem,
            backupListState,
            backupSaveState,
        } = this.state;

        const backupListView = this.renderBackupListViewComponent(
            backupListState,
            data,
            columns,
        );
        const second = this.renderBackupDetailViewComponent(
            selectedBackupItem,
            data,
        );

        return (
            <div className="backups-view">
                <h2 key="pageHeader">Backups</h2>
                <VerticalPanelLayout
                    defaultRatio={0.5}
                    first={[
                        <div className="toolbar" key="toolbarDiv">
                            {this.renderToolbarComponent(backupSaveState)}
                        </div>,
                        <div className="grid-container" key="dataDiv">
                            {backupListView}
                        </div>,
                    ]}
                    second={second}
                />
                {this.renderModalComponent()}
            </div>
        );
    }
}

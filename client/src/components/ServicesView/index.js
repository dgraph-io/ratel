// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import { checkStatus, getEndpoint } from "../../lib/helpers";
import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import sortDataGrid from "../../lib/sortHelper";

import BackupDetail from "./BackupDetail";
import BackupList from "./BackupList";
import BackupFormModel from "./BackupFormModel";
import BackupDeleteModel from "./BackupDeleteModel";

import "./ServicesView.scss";

const STATE_LOADING = 0;
const STATE_SUCCESS = 1;
const STATE_ERROR = 2;

export default class ServicesView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            selectedBackupItem: null,
            status: STATE_LOADING,
            errorMsg: "",
            showBackupDialog: false,
            showDeleteDialog: false,
            backupSelectedOption: this.getDefaultBackupSelection(),
        };
        this.backupOptions = this.getBackupOptions();
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

    getBackupOptions = () => {
        return [
            { id: 1, name: "Amazon S3" },
            { id: 2, name: "Minio" },
            { id: 3, name: "Local directory" },
            { id: 4, name: "NFS" },
        ];
    };

    /*
        Start of REST API Methods
    */
    createBackup = path => {
        const formData = new FormData();
        formData.append("destination", path);

        const { url } = this.props;
        fetch(getEndpoint(url, "admin/backup"), {
            method: "POST",
            mode: "cors",
            body: formData,
            credentials: "same-origin",
        })
            .then(checkStatus)
            .then(res => res.json())
            .then(result => {
                console.log(result);
            })
            .catch(error => {
                console.error(error);
            });
    };
    fetchBackupList = () => {
        setTimeout(() => {
            const data = this.getDummyData();
            if (data) {
                this.setState({
                    data: data,
                    selectedBackupItem: null,
                    status: STATE_SUCCESS,
                    errorMsg: "",
                });
            } else {
                this.setState({
                    data: null,
                    selectedBackupItem: null,
                    status: STATE_ERROR,
                    errorMsg: "Unable to load backup list",
                });
            }
        }, 1000);
    };
    /*
        End of REST API Methods
    */

    /*
        Start of Event Handlers
    */
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
        }
    };

    handleSort = (sortColumn, sortDirection) => {
        const data = sortDataGrid(sortColumn, sortDirection, this.state.data);
        this.setState({ data });
    };

    /*
        End of Event Handlers
    */

    componentDidMount() {
        this.fetchBackupList();
    }
    renderModalComponent = () => {
        const { showBackupDialog, showDeleteDialog } = this.state;
        if (showBackupDialog) {
            return (
                <BackupFormModel
                    onHide={this.handleCloseModal}
                    handleBackupSave={this.handleBackupSave}
                />
            );
        }
        if (showDeleteDialog) {
            return (
                <BackupDeleteModel
                    onHide={this.handleCloseModal}
                    onDelete={this.handleBackupDelete}
                />
            );
        }
    };

    renderToolbarComponent() {
        return (
            <div className="toolbar" key="toolbarDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleBackupClick}
                >
                    Take Backup
                </button>
            </div>
        );
    }

    renderBackupListViewComponent(status, data, columns) {
        return status === STATE_LOADING ? (
            <span>Loading...</span>
        ) : data.length ? (
            <BackupList
                key="servicesBackupList"
                columns={columns}
                data={this.state.data}
                onSelectBackupItem={this.onSelectBackupItem}
                onSort={this.handleSort}
            />
        ) : (
            <span>No backup available</span>
        );
    }

    renderBackupDetailViewComponent(selectedBackupItem) {
        return selectedBackupItem ? (
            <BackupDetail
                data={selectedBackupItem}
                onDeleteClick={this.handleBackupDeleteClick}
                onRestoreClick={this.handleBackupRestore}
            />
        ) : (
            <span>Please select a backup from the list on the left</span>
        );
    }

    render() {
        const columns = this.getColumns();
        const { data, selectedBackupItem, status } = this.state;

        const backupListView = this.renderBackupListViewComponent(
            status,
            data,
            columns,
        );
        const second = this.renderBackupDetailViewComponent(selectedBackupItem);

        return (
            <div className="services-view">
                <h2 key="servicesHeader">Services</h2>
                <VerticalPanelLayout
                    defaultRatio={0.5}
                    first={[
                        this.renderToolbarComponent(),
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

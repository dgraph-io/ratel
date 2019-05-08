// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";

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
            showBackupDialog: false,
            showDeleteDialog: false,
        };
        this.backupOptions = this.getBackupOptions();
    }

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
            },
            {
                key: "size",
                name: "Size",
                sortable: true,
                width: 150,
            },
            {
                key: "location",
                name: "Location",
                sortable: true,
                width: 150,
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

    fetchBackupList = () => {
        setTimeout(() => {
            const data = this.getDummyData();
            this.setState({
                data: data,
                selectedBackupItem: null,
                status: STATE_SUCCESS,
            });
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

    handleBackupDelete = e => {
        const data = this.state.data.filter(item => item.id !== e.id);
        this.setState({
            data: data,
            selectedBackupItem: data[0],
        });
    };

    handleBackupRestore = e => {
        // restore and delete the backup
    };

    componentDidMount() {
        this.fetchBackupList();
    }

    renderModalComponent = () => {
        const { showBackupDialog, showDeleteDialog } = this.state;
        if (showBackupDialog) {
            return (
                <BackupFormModel
                    onHide={this.handleCloseModal}
                    options={this.backupOptions}
                />
            );
        }
        if (showDeleteDialog) {
            return <BackupDeleteModel onHide={this.handleCloseModal} />;
        }
    };
    render() {
        const columns = this.getColumns();
        const { data, selectedBackupItem, status } = this.state;

        const toolbar = (
            <div className="toolbar" key="toolbarDiv">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleBackupClick}
                >
                    Take Backup
                </button>
            </div>
        );

        const backupListView =
            status === STATE_LOADING ? (
                <span>Loading...</span>
            ) : data.length ? (
                <BackupList
                    key="servicesBackupList"
                    columns={columns}
                    data={this.state.data}
                    onSelectBackupItem={this.onSelectBackupItem}
                />
            ) : (
                <span>No backup available</span>
            );

        const second = selectedBackupItem ? (
            <BackupDetail
                data={selectedBackupItem}
                onDeleteClick={this.handleBackupDelete}
                onRestoreClick={this.handleBackupRestore}
            />
        ) : (
            <span>Please select a backup from the list on the left</span>
        );

        return (
            <div className="services-view">
                <h2 key="servicesHeader">Services</h2>
                <VerticalPanelLayout
                    defaultRatio={0.5}
                    first={[
                        toolbar,
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

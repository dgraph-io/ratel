// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

const BackupDetail = ({ data, onDeleteClick, onRestoreClick }) => {
    if (data) {
        return (
            <div className="container">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">{data.location}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">
                            Path: {data.path}
                        </h6>
                        <p className="card-text">Date Time: {data.timestamp}</p>
                        <button
                            className="btn btn-danger"
                            onClick={() => onDeleteClick(data)}
                        >
                            Delete
                        </button>
                        <button
                            className="float-right btn btn-primary right"
                            onClick={() => onRestoreClick(data)}
                        >
                            Restore
                        </button>
                    </div>
                </div>
            </div>
        );
    } else {
        return null;
    }
};

export default BackupDetail;

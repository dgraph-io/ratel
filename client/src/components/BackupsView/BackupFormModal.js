// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

const BackupFormModal = ({
    path,
    onHide,
    handleBackupSave,
    handleBackupPathChange,
}) => {
    const handleKeyDown = e => {
        if (e.key === "Enter" && path.length) {
            handleBackupSave();
        }
    };

    return (
        <Modal show={true} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Take backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-4">
                    <Form.Group controlId="path">
                        <Form.Control
                            required
                            type="text"
                            placeholder="please enter valid backup path"
                            onChange={e =>
                                handleBackupPathChange(e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                        />
                        <Form.Text>
                            Supported backup types Amazon S3 / Minio / Local
                            direcctory or NFS
                        </Form.Text>
                    </Form.Group>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    as="input"
                    type="button"
                    value="Save"
                    disabled={!path.length}
                    onClick={handleBackupSave}
                />
            </Modal.Footer>
        </Modal>
    );
};

export default BackupFormModal;

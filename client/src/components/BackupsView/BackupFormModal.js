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

const BackupFormModal = ({ onHide, handleBackupSave }) => {
    let path = "";
    const handlePathChange = e => (path = e.target.value);
    const handleSubmit = event => {
        event.preventDefault();
        handleBackupSave(path);
    };

    return (
        <Modal show={true} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Take backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Form.Group controlId="path">
                            <Form.Control
                                required
                                type="text"
                                placeholder="please enter valid backup path"
                                onChange={handlePathChange}
                            />
                            <Form.Text>
                                Supported backup types Amazon S3 / Minio / Local
                                direcctory or NFS
                            </Form.Text>
                        </Form.Group>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    as="input"
                    type="button"
                    value="Save"
                    onClick={handleSubmit}
                />
            </Modal.Footer>
        </Modal>
    );
};

export default BackupFormModal;

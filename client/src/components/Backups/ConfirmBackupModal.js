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

import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { useSelector } from "react-redux";

import { DEFAULT_BACKUP_CONFIG } from "actions/backup";
import { getBackupPayload, getBackupUrl } from "./backupModel";

export default function StartBackupModal({
    onCancel,
    onStartBackup,
    dgraphUrl,
}) {
    const backupConfig =
        useSelector(state => state.backup && state.backup.config) ||
        DEFAULT_BACKUP_CONFIG;

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label column sm={12}>
                            Warning: At the moment Ratel doesn't support
                            triggering backups on a server. You need to ssh into
                            a machine running Dgraph Alpha and issue a cURL
                            request from command line. (You may need to change
                            the URL)
                        </Form.Label>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label column sm={12}>
                            Click "Save" to store information about this backup
                            to your local history.
                        </Form.Label>
                    </Form.Group>
                    <Form.Group as={Form.Row}>
                        <Form.Label column sm={12}>
                            Backup Command:
                        </Form.Label>
                    </Form.Group>
                    <Form.Group as={Form.Row} className="backup-preview large">
                        <Form.Label column sm={12} className="command">
                            $ curl -XPOST{" "}
                            {getBackupUrl(dgraphUrl, backupConfig)} -d "
                            {getBackupPayload(backupConfig)}"
                        </Form.Label>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onStartBackup}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

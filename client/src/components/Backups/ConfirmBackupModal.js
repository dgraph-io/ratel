// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import { useSelector } from "react-redux";

import { DISPLAY_STRINGS, getBackupSettings } from "./backupModel";

export default function ConfirmBackupModal({
    onCancel,
    onStartBackup,
    dgraphUrl,
}) {
    const backupConfig = useSelector(state => state.backup.config);
    const STRINGS = DISPLAY_STRINGS[backupConfig.destinationType];

    return (
        <Modal show={true} onHide={onCancel} size="md">
            <Modal.Header closeButton>
                <Modal.Title>Confirm Backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Row}>
                        <Form.Label column sm={12}>
                            <strong>
                                Please review your settings before starting the
                                backup:
                            </strong>
                        </Form.Label>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPlainType">
                        <Form.Label column sm="4">
                            Destination Type
                        </Form.Label>
                        <Col sm="8">
                            <Form.Control
                                plaintext
                                readOnly
                                defaultValue={STRINGS.name}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPlainDest">
                        <Form.Label column sm="4">
                            {STRINGS.pathName}
                        </Form.Label>
                        <Col sm="8">
                            <Form.Control
                                plaintext
                                readOnly
                                defaultValue={backupConfig.backupPath}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPlainSettings">
                        <Form.Label column sm="4">
                            Settings
                        </Form.Label>
                        <Col sm="8">
                            <Form.Control
                                plaintext
                                readOnly
                                defaultValue={getBackupSettings(backupConfig)}
                            />
                        </Col>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Back
                </Button>
                <Button variant="primary" onClick={onStartBackup}>
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

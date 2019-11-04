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
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import { DISPLAY_STRINGS, getBackupPayload } from "./backupModel";
import RadioSelect from "./RadioSelect";

export default function StartBackupModal({
    onCancel,
    onStartBackup,
    backupConfig,
    dgraphUrl,
    setBackupConfig,
}) {
    const {
        destinationType,
        backupPath,
        accessKey,
        secretKey,
        forceFull,
    } = backupConfig;

    const backupTypes = ["nfs", "aws", "minio"];

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Start New Backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Form.Row}>
                        <RadioSelect
                            value={destinationType}
                            controlName={"Destination Type"}
                            radioItems={backupTypes}
                            itemLabels={backupTypes.map(
                                t => DISPLAY_STRINGS[t].name,
                            )}
                            onChange={destinationType =>
                                setBackupConfig({
                                    backupPath,
                                    destinationType,
                                })
                            }
                        />
                    </Form.Group>

                    <Form.Group as={Form.Row}>
                        <Form.Label column sm={12}>
                            {DISPLAY_STRINGS[destinationType].pathName}:
                        </Form.Label>
                        <Col sm={12}>
                            <Form.Control
                                type="text"
                                id="backup-path"
                                placeholder={
                                    DISPLAY_STRINGS[destinationType].placeholder
                                }
                                value={backupPath}
                                onChange={e =>
                                    setBackupConfig({
                                        destinationType,
                                        backupPath: e.target.value,
                                    })
                                }
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group
                        as={Form.Row}
                        style={{
                            width: "100%",
                            fontSize: "0.75em",
                            backgroundColor: "#efefef",
                            borderRadius: 2,
                        }}
                    >
                        <Form.Label column sm={12}>
                            Backup Request:
                        </Form.Label>
                        <Form.Label column sm={12}>
                            $ curl -XPOST {dgraphUrl}/admin/backup -d "
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
                    Start Backup
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

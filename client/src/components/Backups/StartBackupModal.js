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

import { getBackupPayload } from "lib/helpers";

export default function StartBackupModal({
    onCancel,
    onStartBackup,
    backupConfig,
    dgraphUrl,
    setBackupConfig,
}) {
    const { destinationType, backupPath } = backupConfig || {};

    const displayStrings = {
        nfs: {
            name: "NFS or local folder",
            pathName: "Filesystem Path",
            placeholder: "/home/dgraph/backupfolder/",
        },
        aws: {
            name: "AWS S3 bucket",
            pathName: "S3 Bucket",
            placeholder: "s3.us-west-2.amazonaws.com/<bucketname>",
        },
        minio: {
            name: "Minio",
            pathName: "Minio Host and Bucket",
            placeholder: "127.0.0.1:9000/<bucketname>",
        },
    };

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Start New Backup</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Form.Row}>
                        <Form.Label column sm={12}>
                            Destination Type:
                        </Form.Label>
                        {["nfs", "aws", "minio"].map(type => (
                            <Col sm={12} key={"radio-" + type}>
                                <Form.Check
                                    type="radio"
                                    checked={type === destinationType}
                                    id={"radio-" + type}
                                    label={displayStrings[type].name}
                                    onChange={() =>
                                        setBackupConfig({
                                            backupPath,
                                            destinationType: type,
                                        })
                                    }
                                />
                            </Col>
                        ))}
                    </Form.Group>

                    <Form.Group as={Form.Row}>
                        <Form.Label column sm={12}>
                            {displayStrings[destinationType].pathName}:
                        </Form.Label>
                        <Col sm={12}>
                            <Form.Control
                                type="text"
                                id="backup-path"
                                placeholder={
                                    displayStrings[destinationType].placeholder
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

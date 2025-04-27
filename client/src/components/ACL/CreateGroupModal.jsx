/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

export default function CreateGroupModal({ onCancel, onDone, createGroup }) {
    const [loading, setLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [errorMsg, setErrorMsg] = useState(null);

    const validate = () => {
        if (!groupName) {
            setErrorMsg("Group Name is required");
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) {
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            await createGroup(groupName);
            setLoading(false);
            await onDone();
        } catch (errorMessage) {
            setErrorMsg(`Could not create group: ${errorMessage}`);
        }
    };

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Create Group</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group controlId="groupName">
                    <Form.Label>Group Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Group Name"
                        onChange={({ target: { value: groupName } }) =>
                            setGroupName(groupName)
                        }
                        value={groupName}
                    />
                </Form.Group>

                {!errorMsg ? null : (
                    <div className="alert alert-danger">{errorMsg}</div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                    variant="default"
                    className="pull-left"
                >
                    Cancel
                </Button>

                <Button
                    variant="primary"
                    disabled={loading}
                    onClick={handleSave}
                >
                    &nbsp;
                    {loading ? "Altering ACL..." : "Create"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

export default function EditUserModal({
    executeMutation,
    isCreate,
    onCancel,
    onDone,
    userName: userNameSupplied,
    userUid,
}) {
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState(userNameSupplied || "");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const validate = () => {
        if (isCreate && !userName) {
            setErrorMessage("User Name is required");
            return false;
        }
        if (!password) {
            setErrorMessage("Password is required");
            return false;
        }
        if (password !== passwordConfirm) {
            setErrorMessage("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) {
            return;
        }

        try {
            const uid = isCreate ? "<_:newUser>" : `<${userUid}>`;
            const mutation = `{
              set {
                ${uid} <dgraph.xid> ${JSON.stringify(userName)} .
                ${uid} <dgraph.password> ${JSON.stringify(password)} .
              }
            }`;
            await executeMutation(mutation);
            onDone();
        } catch (errorMessage) {
            setErrorMessage(`Could not write to database: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{isCreate ? "Create" : "Edit"} User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group controlId="userId">
                    <Form.Label>User Id</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="User Id"
                        disabled={!isCreate || loading}
                        onChange={({ target: { value: userName } }) =>
                            setUserName(userName)
                        }
                        value={userName}
                    />
                </Form.Group>

                <Form.Group controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter password"
                        disabled={loading}
                        onChange={({ target: { value } }) => setPassword(value)}
                        value={password}
                    />
                </Form.Group>

                <Form.Group controlId="passwordRepeat">
                    Re-enter password
                    <Form.Control
                        type="password"
                        placeholder="Enter password again"
                        onChange={({ target: { value } }) =>
                            setPasswordConfirm(value)
                        }
                        disabled={loading}
                        value={passwordConfirm}
                    />
                </Form.Group>
                {!errorMessage ? null : (
                    <div className="alert alert-danger">{errorMessage}</div>
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
                    {loading ? "Altering ACL..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

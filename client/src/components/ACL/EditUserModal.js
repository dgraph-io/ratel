// Copyright 2018 Dgraph Labs, Inc. and Contributors
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

export default class EditUserModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            userName: "",
            password: "",
            passwordAgain: "",
            errorMsg: "",
        };
    }

    validate = () => {
        const { password, passwordAgain, userName } = this.state;
        const { isCreate } = this.props;

        if (isCreate && !userName) {
            this.setState({ errorMsg: "User Name is required" });
            return false;
        }
        if (!password) {
            this.setState({ errorMsg: "New password is required" });
            return false;
        }
        if (!passwordAgain || password !== passwordAgain) {
            this.setState({ errorMsg: "Passwords do not match" });
            return false;
        }
        return true;
    };

    handleSave = async () => {
        if (!this.validate()) {
            return;
        }

        const { executeMutation, isCreate, onDone, userUid } = this.props;
        const { userName, password } = this.state;

        this.setState({
            loading: true,
            errorMsg: "",
        });

        try {
            const uid = isCreate ? "<_:newUser>" : `<${userUid}>`;
            const mutation = `{
              set {
                ${uid} <dgraph.xid> ${JSON.stringify(
                userName || this.props.userName,
            )} .
                ${uid} <dgraph.password> ${JSON.stringify(password)} .
              }
            }`;
            await executeMutation(mutation);
            onDone();
        } catch (errorMessage) {
            this.setState({
                errorMsg: `Could not write to database: ${errorMessage}`,
            });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { errorMsg, loading, userName } = this.state;
        const { onCancel, isCreate } = this.props;

        return (
            <Modal show={true} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isCreate ? "Create" : "Edit"} User
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="userId">
                        <Form.Label>User Id</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="User Id"
                            disabled={!isCreate}
                            onChange={({ target: { value: userName } }) =>
                                this.setState({ userName })
                            }
                            value={userName || this.props.userName}
                        />
                    </Form.Group>

                    <Form.Group controlId="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Enter password"
                            disabled={!isCreate || loading}
                            onChange={({ target: { value: password } }) =>
                                this.setState({ password })
                            }
                            value={this.state.password}
                        />
                    </Form.Group>

                    <Form.Group>
                        Re-enter password
                        <Form.Control
                            type="password"
                            placeholder="Enter password again"
                            onChange={({ target: { value: passwordAgain } }) =>
                                this.setState({ passwordAgain })
                            }
                            disabled={!isCreate || loading}
                            value={this.state.passwordAgain}
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
                        onClick={this.handleSave}
                    >
                        &nbsp;
                        {loading ? "Altering ACL..." : "Save"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

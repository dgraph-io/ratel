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

export default class EditGroupModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            groupName: "",
            errorMsg: "",
        };
    }

    validate = () => {
        const { groupName } = this.state;
        if (!groupName) {
            this.setState({ errorMsg: "Group Name is required" });
            return false;
        }
        return true;
    };

    handleSave = async () => {
        if (!this.validate()) {
            return;
        }

        const { executeMutation, onDone } = this.props;
        const { groupName } = this.state;

        this.setState({
            loading: true,
            errorMsg: "",
        });

        try {
            const mutation = `{
              set {
                <_:group> <dgraph.xid> ${JSON.stringify(groupName)} .
                <_:group> <dgraph.group> "[]" .
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
        const { errorMsg, loading, groupName } = this.state;
        const { onCancel } = this.props;

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
                                this.setState({ groupName })
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
                        onClick={this.handleSave}
                    >
                        &nbsp;
                        {loading ? "Altering ACL..." : "Create"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

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

export default class SchemaDropAllModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            inputValue: "",
            errorMsg: "",
        };
    }

    async handleDropAll() {
        const { executeQuery, onAfterDropAll } = this.props;
        this.setState({
            loading: true,
            errorMsg: "",
        });

        try {
            await executeQuery(
                JSON.stringify({ drop_all: true }),
                "alter",
                true,
            );
            onAfterDropAll();
        } catch (errorMessage) {
            this.setState({
                errorMsg: `Could not drop all: ${errorMessage}`,
            });
        } finally {
            this.setState({ loading: false });
        }
    }

    isLocked = () => this.state.inputValue.trim() !== "DROP ALL";

    render() {
        const { loading, errorMsg } = this.state;
        const { onCancel } = this.props;

        const icon = (
            <i
                className={"fas " + (this.isLocked() ? "fa-lock" : "fa-unlock")}
            />
        );

        return (
            <Modal show={true} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Drop All</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete all of your data including
                    the schema? You <em>will not</em> be able to restore your
                    data once it has been deleted.
                    <Form.Group>
                        <Form.Text>
                            To proceed, please type "DROP ALL" in the text field
                            below.
                        </Form.Text>
                        <Form.Control
                            type="text"
                            placeholder="Type DROP ALL here"
                            onChange={({ target: { value: inputValue } }) =>
                                this.setState({ inputValue })
                            }
                            disabled={loading}
                            value={this.state.inputValue}
                        />
                    </Form.Group>
                    {!errorMsg ? null : (
                        <div className="alert alert-danger">{errorMsg}</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        disabled={loading || this.isLocked()}
                        onClick={() => this.handleDropAll()}
                    >
                        {icon}
                        &nbsp;
                        {loading ? "Dropping All..." : "Drop All"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

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
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import Editor from "../../containers/Editor";
import { getRawSchema } from "../../lib/dgraph-syntax";

export default class SchemaRawModeModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: getRawSchema(this.props.schema),
            editorKey: 1,
        };

        this.handleUpdate = this.handleUpdate.bind(this);
    }

    async handleUpdate() {
        const { executeQuery, onAfterUpdate } = this.props;

        this.setState({
            errorMsg: "",
            updating: true,
        });

        try {
            await executeQuery(this.state.value, "alter", true);
            onAfterUpdate();
        } catch (errorMessage) {
            this.setState({
                errorMsg: `Could not alter schema: ${errorMessage}`,
            });
        } finally {
            this.setState({ updating: false });
        }
    }

    handleResetClick = () => {
        this.setState({
            value: getRawSchema(this.props.schema),
            editorKey: this.state.editorKey + 1,
            errorMsg: null,
        });
    };

    render() {
        const { onCancel, onDropAll } = this.props;
        const { editorKey, updating, errorMsg } = this.state;

        return (
            <Modal show={true} size="lg" onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Schema File</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: 0 }}>
                    <div style={{ border: "1px solid #e5e5e5" }}>
                        <Editor
                            key={editorKey}
                            query={this.state.value}
                            maxHeight={314}
                            onUpdateQuery={value => this.setState({ value })}
                        />
                    </div>
                    {!errorMsg ? null : (
                        <div className="alert alert-danger">{errorMsg}</div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ justifyContent: "space-between" }}>
                    <Button
                        className="pull-left"
                        variant="secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button onClick={this.handleResetClick} disabled={updating}>
                        {updating ? "Updating..." : "Refresh Schema"}
                    </Button>

                    <Button variant="danger" size="sm" onClick={onDropAll}>
                        Drop All
                    </Button>

                    <Button
                        variant="primary"
                        onClick={this.handleUpdate}
                        disabled={updating}
                    >
                        {updating ? "Updating..." : "Apply Schema"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

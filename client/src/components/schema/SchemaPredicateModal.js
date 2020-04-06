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
import SchemaPredicateForm from "./SchemaPredicateForm";

export default class SchemaPredicateModal extends React.Component {
    constructor(props) {
        super(props);

        this.predicateForm = React.createRef();

        this.state = {
            updating: false,
            deleting: false,
            clickedSubmit: false,
            errorMsg: "",
            predicateQuery: null,
        };
    }

    async handleUpdatePredicate() {
        const { executeQuery, onAfterUpdate } = this.props;

        this.setState({
            clickedSubmit: true,
            errorMsg: "",
            updating: true,
        });

        try {
            await executeQuery(this.state.predicateQuery, "alter", true);
            onAfterUpdate();
        } catch (error) {
            this.setState({
                errorMsg: `Could not alter schema: ${error?.message}`,
            });
        } finally {
            this.setState({ updating: false });
        }
    }

    render() {
        const { predicate, onCancel } = this.props;
        const {
            updating,
            clickedSubmit,
            errorMsg,
            predicateQuery,
        } = this.state;

        const predicateForm = this.predicateForm.current;

        const canUpdate =
            predicateForm &&
            predicateForm.isDirty() &&
            !predicateForm.hasErrors();

        return (
            <Modal show={true} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Predicate</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SchemaPredicateForm
                        createMode={true}
                        clickedSubmit={clickedSubmit}
                        ref={this.predicateForm}
                        predicate={predicate}
                        onChangeQuery={predicateQuery =>
                            this.setState({ predicateQuery })
                        }
                    />
                    {!errorMsg ? null : (
                        <div className="alert alert-danger">{errorMsg}</div>
                    )}
                    {!predicateForm ? null : (
                        <div className="form-group clearfix">
                            <label className="col-sm-3 control-label" />
                            <div className="col-sm-9" style={{ color: "#666" }}>
                                Schema string:&nbsp;
                                <span style={{ fontStyle: "italic" }}>
                                    {predicateQuery}
                                </span>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => this.handleUpdatePredicate()}
                        disabled={!canUpdate || updating}
                    >
                        {updating ? "Adding..." : "Add"}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

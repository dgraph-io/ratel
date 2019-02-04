// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

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
        } catch (errorMessage) {
            this.setState({
                errorMsg: `Could not alter schema: ${errorMessage}`,
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
                    <Button onClick={onCancel}>Cancel</Button>
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

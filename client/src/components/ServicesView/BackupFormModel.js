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

const BackupFormModel = ({ onHide, options }) => (
    <Modal show={true} onHide={onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Take backup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <div className="mb-3">
                    {options.map(type => (
                        <Form.Check
                            custom
                            inline
                            type="radio"
                            id={type.id}
                            key={type.id}
                            label={type.name}
                            name="option"
                        />
                    ))}
                </div>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={onHide}>Save</Button>
        </Modal.Footer>
    </Modal>
);

export default BackupFormModel;

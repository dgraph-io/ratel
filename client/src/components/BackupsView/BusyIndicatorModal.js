// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

const BusyIndicatorModal = ({ showStatus, message }) => {
    return (
        <Modal
            show={showStatus}
            backdrop="static"
            keyboard={false}
            size="sm"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header>
                <Modal.Title id="contained-modal-title-vcenter">
                    {message}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Spinner variant="primary" animation="grow" size="sm" />
                <Spinner variant="primary" animation="grow" size="sm" />
                <Spinner variant="primary" animation="grow" size="sm" />
            </Modal.Body>
        </Modal>
    );
};

export default BusyIndicatorModal;

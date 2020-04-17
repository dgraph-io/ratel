// Copyright 2020 Dgraph Labs, Inc. and Contributors
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

import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import { useDispatch, useSelector } from "react-redux";

import { updateZeroUrl } from "../actions/connection";

export default function ZeroUrlWidget() {
    const currentServer = useSelector(
        state => state.connection.serverHistory[0],
    );
    const dispatch = useDispatch();

    const [zeroUrl, setZeroUrl] = useState(currentServer.zeroUrl);

    return (
        <Form onSubmit={e => e.preventDefault()}>
            <Form.Group controlId="zeroUrl">
                <Form.Label>Dgraph Zero URL:</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="http://myzero:6080"
                    value={zeroUrl}
                    onChange={e => {
                        dispatch(updateZeroUrl(zeroUrl));
                        setZeroUrl(e.target.value);
                    }}
                    style={{
                        width: "100%",
                    }}
                />
            </Form.Group>
        </Form>
    );
}

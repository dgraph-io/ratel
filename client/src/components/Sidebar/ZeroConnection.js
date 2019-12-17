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
import { useSelector, useDispatch } from "react-redux";
import { Form } from "react-bootstrap";

import { updateZeroUrl, setZeroConnection } from "actions/url";

export default function() {
    const dispatch = useDispatch();
    const zeroUrl = useSelector(state => state.url.zeroUrl);
    const useZeroConnection = useSelector(state => state.url.useZeroConnection);

    const updateUrl = e => {
        dispatch(updateZeroUrl(e.target.value));
    };

    const toggleConnection = e => {
        dispatch(setZeroConnection(!useZeroConnection));
    };

    return (
        <div>
            <Form.Group>
                <Form.Label>Zero Instance URL (Optional)</Form.Label>
                <Form.Control value={zeroUrl} onChange={updateUrl} />
            </Form.Group>

            <Form.Group>
                <Form.Check
                    checked={useZeroConnection}
                    onChange={toggleConnection}
                    label="Enable Zero Connection"
                />
            </Form.Group>
        </div>
    );
}

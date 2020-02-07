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

import React, { useEffect } from "react";
import { Card } from "react-bootstrap";
import Highlight from "react-highlight";
import { useDispatch, useSelector } from "react-redux";

import { getInstanceHealth } from "actions/cluster";

export default function() {
    const dispatch = useDispatch();
    const { instanceHealth } = useSelector(state => state.cluster);

    // Runs once, when component is created
    useEffect(() => {
        dispatch(getInstanceHealth());
    }, [dispatch]);

    const renderJSONArea = json => {
        json = json ? JSON.stringify(json, null, 2) : "";

        return (
            <Card bg="light">
                <Card.Body>
                    <Highlight>{json}</Highlight>
                </Card.Body>
            </Card>
        );
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Cluster Management</Card.Title>

                {renderJSONArea(instanceHealth)}
            </Card.Body>
        </Card>
    );
}

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

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Tabs, Tab } from "react-bootstrap";
import {
    getInstanceHealth,
    getClusterHealth,
    getClusterState,
} from "actions/cluster";
import Highlight from "react-highlight";

import "./ClusterPage.scss";

export default function() {
    const dispatch = useDispatch();
    const instanceHealth = useSelector(state => state.cluster.instanceHealth);
    const clusterHealth = useSelector(state => state.cluster.clusterHealth);
    const state = useSelector(state => state.cluster.state);

    // Runs once, when component is created
    useEffect(() => {
        loadRelevantInformation("instancehealth");
    }, []);

    const loadRelevantInformation = key => {
        switch (key) {
            case "instancehealth":
                return dispatch(getInstanceHealth());
            case "clusterhealth":
                return dispatch(getClusterHealth());
            case "state":
                return dispatch(getClusterState());
            default:
                console.log("Unknown key: " + key);
        }
    };

    const renderJSONArea = json => {
        json = json ? JSON.stringify(json, null, 2) : "";

        return (
            <Card bg="light">
                <Card.Body className="h-100">
                    <Highlight>{json}</Highlight>
                </Card.Body>
            </Card>
        );
    };

    return (
        <div className="py-3 pr-3 h-100">
            <Card className="h-100">
                <Card.Body className="card-overflow">
                    <Card.Title>Cluster Management</Card.Title>

                    <Tabs
                        defaultActiveKey="instancehealth"
                        onSelect={loadRelevantInformation}
                    >
                        <Tab
                            eventKey="instancehealth"
                            title="Instance Health"
                            className="p-4"
                        >
                            {renderJSONArea(instanceHealth)}
                        </Tab>
                        <Tab
                            eventKey="clusterhealth"
                            title="Cluster Health"
                            className="p-4"
                        >
                            {renderJSONArea(clusterHealth)}
                        </Tab>
                        <Tab eventKey="state" title="State" className="p-4">
                            {renderJSONArea(state)}
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </div>
    );
}

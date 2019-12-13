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
import { useDispatch, useSelector } from "react-redux";
import { Card, Tabs, Tab } from "react-bootstrap";
import { getClusterHealth, getClusterState } from "actions/cluster";

export default function() {
    const dispatch = useDispatch();
    const healthJSON = useSelector(state => state.cluster.health.default);
    const allHealthJSON = useSelector(state => state.cluster.health.all);
    const stateJSON = useSelector(state => state.cluster.state);

    const onTabChange = key => {
        if (key === "health") {
            dispatch(getClusterHealth());
        } else if (key === "healthall") {
            dispatch(getClusterHealth("all"));
        } else if (key === "state") {
            dispatch(getClusterState());
        }
    };

    return (
        <div className="py-3 pr-3 h-100">
            <Card className="h-100">
                <Card.Body>
                    <Card.Title>Cluster Management</Card.Title>

                    <Tabs defaultActiveKey="health" onSelect={onTabChange}>
                        <Tab eventKey="health" title="Health" className="p-4">
                            {healthJSON || "Nothing to show."}
                        </Tab>
                        <Tab
                            eventKey="healthall"
                            title="Health All"
                            className="p-4"
                        >
                            {allHealthJSON || "Nothing to show."}
                        </Tab>
                        <Tab eventKey="state" title="State" className="p-4">
                            {stateJSON || "Nothing to show."}
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </div>
    );
}

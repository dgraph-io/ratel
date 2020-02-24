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

import React from "react";
import * as moment from "moment";
import { Card } from "react-bootstrap";
import Highlight from "react-highlight";
import { useDispatch, useSelector } from "react-redux";
import useInterval from "use-interval";

import { getClusterState, getInstanceHealth } from "actions/cluster";

import "./ClusterPage.scss";

export default function() {
    const dispatch = useDispatch();
    const { instanceHealth, clusterState } = useSelector(
        state => state.cluster,
    );

    useInterval(() => {
        dispatch(getInstanceHealth());
        dispatch(getClusterState());
    }, 2000);

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

    const getHealthDot = addr => {
        const health = (instanceHealth || []).find(r => r.address === addr);

        if (!health) {
            return <div className="health unknown" />;
        }

        const humanizeLastEcho = () => {
            if (!health.lastEcho) {
                return "";
            }
            const lastPing = health.lastEcho * 1000 - Date.now();
            return ` - last echo ${moment.duration(lastPing).humanize(true)}`;
        };

        return (
            <div
                className={
                    health.status === "healthy"
                        ? "health healthy"
                        : "health dead"
                }
                title={`${health.status}${humanizeLastEcho()}`}
            />
        );
    };

    const renderZeros = () => {
        if (!clusterState || !clusterState.zeros) {
            return;
        }

        const zeros = clusterState.zeros;

        return (
            <div className="zeros">
                <div className="summary-panel">
                    <h1>Zeros ({Object.values(zeros).length})</h1>
                    <div className="license">
                        <span className="value">
                            {clusterState.license.enabled
                                ? "Enterprise License"
                                : "Community Edition"}
                        </span>
                        <br />
                        Max Nodes:{" "}
                        <span className="value">
                            {clusterState.license.maxNodes > 1e10
                                ? "∞"
                                : clusterState.license.maxNodes}
                        </span>
                        <br />
                        Expires:{" "}
                        <span className="value">
                            {moment
                                .duration(
                                    clusterState.license.expiryTs * 1000 -
                                        Date.now(),
                                    "ms",
                                )
                                .humanize(true)}
                        </span>
                    </div>
                </div>
                <div className="nodes">
                    {Object.values(zeros).map(z => (
                        <div className="zero" key={z.id}>
                            {getHealthDot(z.addr)}
                            <div className="id" title={`Id: ${z.id}`}>
                                {z.id} -
                            </div>
                            <span title={z.addr}>{z.addr}</span>
                            {!z.leader ? null : (
                                <div className="leader" title="Leader" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Cluster Management</Card.Title>
                {renderZeros()}
                {/* Temporary spacer between prod and debug views. */}
                <div style={{ height: "300px" }} />
                /health?all: {renderJSONArea(instanceHealth)}
                /state: {renderJSONArea(clusterState)}
            </Card.Body>
        </Card>
    );
}

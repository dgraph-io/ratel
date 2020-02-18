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
import { useDispatch, useSelector } from "react-redux";
import useInterval from "use-interval";

import { getClusterState, getInstanceHealth } from "actions/cluster";
import ColorGenerator from "lib/ColorGenerator";

import "./ClusterPage.scss";

export default function() {
    const dispatch = useDispatch();
    const { instanceHealth, clusterState } = useSelector(
        state => state.cluster,
    );

    useInterval(() => {
        dispatch(getInstanceHealth());
        dispatch(getClusterState());
    }, 4000);

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

    const renderNode = node => (
        <div className="node" key={node.id}>
            {getHealthDot(node.addr)}
            <div className="id" title={`Id: ${node.id}`}>
                {node.id} -
            </div>
            <span title={node.addr}>{node.addr}</span>
            {node.leader && <div className="leader" title="Leader" />}
        </div>
    );

    const renderZeros = zeros => {
        if (!zeros) {
            return;
        }

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
                    {Object.values(zeros).map(renderNode)}
                </div>
            </div>
        );
    };

    const renderGroups = groups => {
        if (!groups) {
            return;
        }

        const colors = new ColorGenerator();

        return (
            <>
                <h1>Groups ({Object.entries(groups).length})</h1>

                <div className="groups">
                    {Object.entries(groups).map(([key, g]) => (
                        <div
                            className="group"
                            key={key}
                            style={{
                                backgroundColor: `rgba(${colors
                                    .getRGBA(0.25)
                                    .join(",")})`,
                            }}
                        >
                            <h1 title={`Group #${key}`}>Group #{key}</h1>
                            <div className="nodes">
                                {Object.values(g.members || {}).map(renderNode)}
                            </div>
                            <h1>
                                Tablets ({Object.keys(g.tablets || {}).length})
                            </h1>
                            <div className="tablets">
                                {Object.keys(g.tablets || {}).map(p => (
                                    <div className="tablet" key={p}>
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Cluster Management</Card.Title>
                {renderZeros(clusterState && clusterState.zeros)}
                {renderGroups(clusterState && clusterState.groups)}
            </Card.Body>
        </Card>
    );
}

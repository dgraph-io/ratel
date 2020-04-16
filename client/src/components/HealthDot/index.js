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

import { FetchError, Fetching, OK, Unknown } from "../../lib/constants";
import { isLatestVersion } from "../../lib/dgraph-syntax";

import "./index.scss";

export default function HealthDot({ health, version }) {
    const getHealthClass = health => {
        if (health === OK) {
            return "ok";
        }
        if (health === Unknown || health === Fetching) {
            return "fetching";
        }
        if (health === FetchError) {
            return "error";
        }
    };
    const healthClass = getHealthClass(health);
    const needsUpdate = version && !isLatestVersion(version);
    const versionClass = needsUpdate && healthClass === "ok" ? "outdated" : "";

    function getTitle() {
        switch (healthClass) {
            case "ok":
                return needsUpdate
                    ? `Healthy, Dgraph Upgrade Available`
                    : "Healthy";
            case "fetching":
                return "Connecting Now";

            case "error":
                return "Connection Error";
            default:
                return "Unknown Status";
        }
    }

    return (
        <span
            className={["health-dot", healthClass, versionClass].join(" ")}
            title={getTitle()}
        >
            <i className="fas fa-circle circle" />
            <i className="fas fa-plug fetching" />
            <i className="fas fa-lock locked" />
            <i className="fas fa-unlock-alt unlocked" />
            <i className="fas fa-exclamation-triangle error" />
        </span>
    );
}

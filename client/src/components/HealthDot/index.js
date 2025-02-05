/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

import { FetchError, Fetching, OK, Unknown } from "lib/constants";
import { isLatestVersion } from "lib/dgraph-syntax";

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

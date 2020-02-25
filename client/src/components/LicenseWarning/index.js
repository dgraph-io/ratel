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
import { duration } from "moment";
import { useDispatch, useSelector } from "react-redux";
import useInterval from "use-interval";

import { getClusterState } from "actions/cluster";
import { dismissLicenseWarning } from "actions/url";

import "./LicenseWarning.scss";

// After user has closed the license warning it will re-appear after the
// NAG_INTERVAL in case they closed it accidentally or forgot.
const NAG_INTERVAL = duration(1, "days");

// How long before expiryTs we start showing the warning
const EXPIRES_SOON_WINDOW = duration(7, "days");

// How long after the expiryTs we stop warning them - in case they decided not
// to renew this warning will become annoying to them.
const HAS_EXPIRED_WINDOW = duration(14, "days");

export default function() {
    const dispatch = useDispatch();

    useInterval(() => {
        dispatch(getClusterState());
    }, 60000);

    const { licenseWarningDismissedTimestamp } = useSelector(
        state => state.url,
    );
    const { clusterState } = useSelector(state => state.cluster);

    const license = clusterState && clusterState.license;

    if (
        !license ||
        duration(Date.now() - licenseWarningDismissedTimestamp) < NAG_INTERVAL
    ) {
        return null;
    }

    const timeLeft = duration(license.expiryTs * 1000 - Date.now());

    if (
        timeLeft > EXPIRES_SOON_WINDOW ||
        (timeLeft < 0 && timeLeft.abs() > HAS_EXPIRED_WINDOW)
    ) {
        return null;
    }

    if (license.enabled && timeLeft < EXPIRES_SOON_WINDOW) {
        return (
            <div className="license-warning">
                Your enterprise license will expire{" "}
                <strong>{timeLeft.humanize(true)}</strong> from now. To continue
                using enterprise features after{" "}
                <strong>{timeLeft.humanize()}</strong> from now, apply a valid
                license. To get a new license, contact us at{" "}
                <a href="https://dgraph.io/contact" target="_blank">
                    https://dgraph.io/contact
                </a>
                .
                <button
                    className="dismiss"
                    onClick={() => dispatch(dismissLicenseWarning())}
                >
                    dismiss
                </button>
            </div>
        );
    }

    return (
        <div className="license-warning expired">
            Your enterprise license has expired and enterprise features are
            disabled. To continue using enterprise features, apply a valid
            license. To receive a new license, contact us at{" "}
            <a href="https://dgraph.io/contact" target="_blank">
                https://dgraph.io/contact
            </a>
            .
            <button
                className="dismiss"
                onClick={() => dispatch(dismissLicenseWarning())}
            >
                dismiss
            </button>
        </div>
    );
}

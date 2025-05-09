/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function FrameErrorMessage({ error }) {
    return (
        <React.Fragment>
            <div className="text-content">
                <p>
                    <strong>Error Name:</strong> {error.name}
                </p>
                <p>
                    <strong>Message:</strong> {error.errors?.[0]?.message}
                </p>
                <hr />
                <p>
                    <strong>Raw Error:</strong>
                </p>
                <pre>{JSON.stringify(error, null, 2)}</pre>
            </div>

            <div className="footer error-footer">
                <i className="fas fa-exclamation-triangle error-mark" />{" "}
                <span className="result-message">Error occurred</span>
            </div>
        </React.Fragment>
    )
}

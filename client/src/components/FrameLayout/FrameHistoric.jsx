/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

export default function FrameLoading() {
    return (
        <div className="loading-outer">
            <div>
                <div className="text">This frame from history has been executed already.</div>
            </div>
        </div>
    )
}

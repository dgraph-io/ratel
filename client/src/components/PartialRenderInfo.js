/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function PartialRenderInfo({ remainingNodes, onShowMoreNodes }) {
    return (
        <div className="partial-render-info">
            Only a subset of the graph was rendered.
            <button
                className="btn btn-link"
                style={{ verticalAlign: "baseline" }}
                onClick={onShowMoreNodes}
            >
                Expand remaining {remainingNodes} nodes.
            </button>
        </div>
    )
}

/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import FrameErrorMessage from "./FrameErrorMessage";

export default function FrameMessage({ frame, tabResult }) {
    if (tabResult.error) {
        return <FrameErrorMessage error={tabResult.error} />;
    }

    return (
        <div className="text-content">
            {`Message: ${
                tabResult.response &&
                tabResult.response.data &&
                tabResult.response.data.message
            }`}
        </div>
    );
}

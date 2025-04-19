/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import "./index.scss"

export default function WizardSteps({ steps = [] }) {
    return (
        <ol className="wizard-steps">
            {steps.map(({ title, content, className }, idx) => (
                <React.Fragment key={idx}>
                    <li title={title} className={"item " + className}>
                        {content}
                    </li>
                    <li className={"sep " + steps[idx + 1]?.className} />
                </React.Fragment>
            ))}
        </ol>
    )
}

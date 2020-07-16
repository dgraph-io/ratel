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

import "./index.scss";

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
    );
}

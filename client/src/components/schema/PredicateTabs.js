// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

import React, { useState } from "react";

import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import PredicatePropertiesPanel from "./PredicatePropertiesPanel";
import SampleDataPanel from "./SampleDataPanel";

export default function PredicateTabs({
    executeQuery,
    onAfterDrop,
    onAfterUpdate,
    onOpenGeneratedQuery,
    predicate,
}) {
    const [rightPaneTab, setRightPaneTab] = useState("props"); // props or "samples"
    return (
        <Tabs
            className="tabs-container"
            id="right-tabs"
            activeKey={rightPaneTab}
            onSelect={setRightPaneTab}
        >
            <Tab eventKey="props" title="Properties" className="auto-grow">
                {!predicate ? null : (
                    <PredicatePropertiesPanel
                        key={predicate.predicate}
                        predicate={predicate}
                        executeQuery={executeQuery}
                        onAfterDrop={onAfterDrop}
                        onAfterUpdate={onAfterUpdate}
                    />
                )}
            </Tab>
            <Tab
                eventKey="samples"
                title="Samples & Statistics"
                className="nostretch"
            >
                {!predicate ? null : (
                    <SampleDataPanel
                        key={predicate.predicate}
                        predicate={predicate}
                        executeQuery={executeQuery}
                        onOpenGeneratedQuery={onOpenGeneratedQuery}
                    />
                )}
            </Tab>
        </Tabs>
    );
}

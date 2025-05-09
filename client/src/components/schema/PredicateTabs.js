/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

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
    const [rightPaneTab, setRightPaneTab] = useState("props") // props or "samples"
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
            <Tab eventKey="samples" title="Samples & Statistics" className="nostretch">
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
    )
}

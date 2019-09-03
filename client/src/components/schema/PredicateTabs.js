// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

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

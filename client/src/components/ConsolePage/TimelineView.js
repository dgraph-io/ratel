// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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
import { Card } from "react-bootstrap";
import Highlight from "react-highlight";

import "./TimelineView.scss";

export default function({ results }) {
    let counter = 0;

    const parseResults = results => {
        const data =
            results && results.response && results.response.data
                ? results.response.data
                : {};
        const parsedResults = [];

        for (var queryKey in data) {
            if (data[queryKey] instanceof Array) {
                parsedResults.push(...data[queryKey].filter(r => r.date));
            }
        }

        return parsedResults.sort(
            (a, b) => new Date(a.date) - new Date(b.date),
        );
    };

    const getOddOrEvenClass = () => (counter % 2 === 0 ? "even" : "odd");

    const renderInstructions = () => (
        <div className="text-muted text-center py-4">
            Your objects must contain a predicate or alias named 'date' to use
            the timeline display.
        </div>
    );

    const timelineObjects = parseResults(results);
    console.log(results);

    return (
        <div>
            {timelineObjects.length === 0 && renderInstructions()}

            <div className="timeline p-4">
                {timelineObjects.map(obj => (
                    <div
                        key={counter++}
                        className={"section pb-4 " + getOddOrEvenClass()}
                    >
                        <div className="marker" />
                        <Card>
                            <Card.Header>
                                {new Date(obj.date).toLocaleString()}
                            </Card.Header>
                            <Card.Body>
                                <Highlight>
                                    {JSON.stringify(obj, null, 2)}
                                </Highlight>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

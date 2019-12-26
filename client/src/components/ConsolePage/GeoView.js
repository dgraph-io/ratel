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
import {
    ComposableMap,
    ZoomableGroup,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps";

const geoUrl =
    "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

export default function({ results }) {
    /*
     * Parses the result object and only shows records with the location field
     * @param results - result object to parse
     */
    const parseResults = results => {
        const data =
            results && results.response && results.response.data
                ? results.response.data
                : {};
        const parsedResults = [];

        for (var queryKey in data) {
            if (data[queryKey] instanceof Array) {
                parsedResults.push(...data[queryKey].filter(r => r.location));
            }
        }

        return parsedResults;
    };

    const locations = parseResults(results);
    console.log(locations);

    return (
        <div className="pr-5">
            {locations.length == 0 && (
                <div className="text-center text-muted pt-2">
                    Your objects must contain a predicate or alias named
                    'location' to use the geo display. To show a label, use a
                    predicate or alias named 'label'.
                </div>
            )}

            <ComposableMap>
                <ZoomableGroup zoom={0.9}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#D6D6DA"
                                    stroke="black"
                                    strokeWidth="0.5"
                                />
                            ))
                        }
                    </Geographies>
                    {locations.map(({ label, location }) => (
                        <Marker key={label} coordinates={location.coordinates}>
                            <circle
                                r={2.5}
                                fill="#F00"
                                stroke="#fff"
                                strokeWidth={0}
                            />
                            {label && (
                                <text
                                    textAnchor="middle"
                                    style={{
                                        fontFamily: "system-ui",
                                        fill: "#5D5A6D",
                                    }}
                                    font-size="3"
                                    y="5	"
                                >
                                    {label}
                                </text>
                            )}
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>

            <div className="text-muted text-center">
                Use CTRL + Scroll wheel to zoom.
            </div>
        </div>
    );
}

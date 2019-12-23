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

export default function({ result }) {
    const parsedResults = () => {
        const data =
            result && result.response && result.response.data
                ? result.response.data
                : {};
        const results = [];

        for (var queryKey in data) {
            if (data[queryKey] instanceof Array) {
                data[queryKey].forEach(r => {
                    if (r.location) {
                        results.push(r);
                    }
                });
            }
        }

        return results;
    };

    return (
        <div className="pr-5">
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
                    {parsedResults().map(({ name, location }) => (
                        <Marker key={name} coordinates={location.coordinates}>
                            <circle
                                r={3}
                                fill="#F00"
                                stroke="#fff"
                                strokeWidth={0}
                            />
                            {/*<text
								textAnchor="middle"
								style={{ fontFamily: "system-ui", fill: "#5D5A6D" }}
								font-size="3"
							>
								{name}
							</text>*/}
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

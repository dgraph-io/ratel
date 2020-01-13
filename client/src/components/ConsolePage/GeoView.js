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

import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
    ComposableMap,
    ZoomableGroup,
    Geographies,
    Geography,
    Marker,
    Line,
} from "react-simple-maps";
import { Form } from "react-bootstrap";

import "./GeoView.scss";

export default function({ results }) {
    const query = useSelector(state => state.query.query);

    const [showLabels, setShowLabels] = useState(true);
    const [mapUrl, setMapUrl] = useState(
        "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json",
    );

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

    /*
     * Instructions for how to use the geo view
     */
    const renderInstructions = () => (
        <div className="text-center py-2">
            Your objects must contain a predicate or alias named 'location' to
            use the geo display. To show a label, use a predicate or alias named
            'label'.
        </div>
    );

    /*
     * Creates a geography on the map
     */
    const renderGeography = geo => (
        <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="#fc460f"
            stroke="white"
            strokeWidth="0.5"
        />
    );

    const renderRecord = record => {
        switch (record.location.type) {
            case "Point":
                return renderPoint(record);
            case "Polygon":
                return renderPolygon(record);
            case "MultiPolygon":
                return renderMultiPolygon(record);
            default:
            // Do nothing
        }
    };

    /*
     * Creates a marker based on the location and optional label
     */
    const renderPoint = ({ label, location }) => (
        <Marker key={label} coordinates={location.coordinates}>
            {/* Circle marker */}
            <g
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(-3, -6) scale(0.25)"
            >
                <circle cx="12" cy="10" r="3" fill="white" />
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
            </g>

            {/* Optional label */}
            {showLabels && label && (
                <text
                    textAnchor="middle"
                    style={{
                        fontFamily: "system-ui",
                        fill: "black",
                    }}
                    fontSize="3"
                    fontWeight="bold"
                    y="2"
                >
                    {label}
                </text>
            )}
        </Marker>
    );

    /*
     * Renders a polygon
     */
    const renderPolygon = ({ label, location }) => {
        const points = location.coordinates[0];
        const midpoint = points
            .slice(0, -1)
            .reduce((avg, point) => [avg[0] + point[0], avg[1] + point[1]], [
                0,
                0,
            ])
            .map(p => p / (points.length - 1));

        return (
            <React.Fragment>
                <Line key={label} coordinates={points} strokeWidth={1} />
                <Marker key={`label${label}`} coordinates={midpoint}>
                    {showLabels && label && (
                        <text
                            textAnchor="middle"
                            style={{
                                fontFamily: "system-ui",
                                fill: "black",
                            }}
                            fontSize="3"
                            fontWeight="bold"
                        >
                            {label}
                        </text>
                    )}
                </Marker>
            </React.Fragment>
        );
    };

    /*
     * Renders a multipolygon
     */
    const renderMultiPolygon = ({ label, location }) => {
        let i = 0;
        return location.coordinates
            .map(p => ({
                label: label + " " + i++,
                location: {
                    coordinates: p,
                },
            }))
            .map(renderPolygon);
    };

    const renderQuery = () => {
        const queryRegex = /(func:)(.*)(\(.*\))/;
        const regexResult = queryRegex.exec(query);

        if (regexResult) {
            switch (regexResult[2]) {
                case "near":
                case "within":
                case "contains":
                case "intersects":
                    console.log(regexResult);
            }
        }
    };

    // Render starts here
    const locations = parseResults(results);

    return (
        <div className="map-wrapper">
            {/* Usage instructions */}
            {locations.length === 0 && renderInstructions()}
            <ComposableMap className="map" projection="geoEqualEarth">
                <ZoomableGroup zoom={0.9} maxZoom={20}>
                    {/* Draw world map */}
                    <Geographies geography={mapUrl}>
                        {({ geographies }) => geographies.map(renderGeography)}
                    </Geographies>
                    {/* Render records */}
                    {locations.map(renderRecord)}
                    {renderQuery()}
                </ZoomableGroup>
            </ComposableMap>

            {/* Controls */}
            <div className="d-flex px-3 py-2">
                <div className="flex-fill">
                    Use CTRL + Scroll wheel to zoom and drag to pan. Touch
                    controls are also supported.
                </div>
                <div className="pl-3">
                    <Form.Check
                        label="Show Labels"
                        checked={showLabels}
                        onChange={() => setShowLabels(!showLabels)}
                    />
                </div>
            </div>
        </div>
    );
}

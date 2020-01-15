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
import { Form, Modal, Button, Row, Col, Alert } from "react-bootstrap";

import "./GeoView.scss";

export default function({ results }) {
    const query = useSelector(state => state.query.query);

    const [showOptions, setShowOptions] = useState(false);

    const [showLabels, setShowLabels] = useState(true);
    const [currentZoom, setCurrentZoom] = useState(1);
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
        <div className="text-center px-3 pt-5">
            <Alert variant="danger" className="mb-0">
                Your objects must contain a predicate or alias named 'location'
                to use the geo display. To show a label, use a predicate or
                alias named 'label'.
            </Alert>
        </div>
    );

    /*
     * Creates a geography on the map
     */
    const renderGeography = geo => (
        <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="#e65124"
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

    const renderLabel = (label, color, y = 0) => (
        <>
            {showLabels && label && (
                <g
                    transform={`translate(0, ${y / currentZoom}) scale(${1 /
                        currentZoom})`}
                >
                    <text
                        textAnchor="middle"
                        style={{
                            fontFamily: "system-ui",
                            fill: color,
                        }}
                        fontSize="8"
                        fontWeight="bold"
                    >
                        {label}
                    </text>
                </g>
            )}
        </>
    );

    /*
     * Creates a marker based on the location and optional label
     */
    const renderPoint = (
        { label, location },
        markerColor = "black",
        textColor = "black",
    ) => (
        <Marker key={label} coordinates={location.coordinates}>
            {/* Circle marker */}
            <g
                fill="none"
                stroke={markerColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={`translate(${-6 / currentZoom}, ${-12 /
                    currentZoom}) scale(${0.5 / currentZoom})`}
            >
                <circle cx="12" cy="10" r="3" fill="white" />
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
            </g>

            {/* Optional label */}
            {renderLabel(label, textColor, 6)}
        </Marker>
    );

    /*
     * Renders a polygon
     */
    const renderPolygon = (
        { label, location },
        polygonColor = "black",
        textColor = "black",
    ) => {
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
                <Line
                    key={label}
                    coordinates={points}
                    strokeWidth={1 / currentZoom}
                    stroke={polygonColor}
                />
                <Marker key={`label${label}`} coordinates={midpoint}>
                    {renderLabel(label, textColor)}
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

    /*
     * Renders the query on the map, based on the geo function used
     */
    const renderQuery = () => {
        const queryRegex = /func:\s*(.*)\(([^\)]*)/;
        const regexResult = queryRegex.exec(query);

        if (regexResult) {
            const [, func, args] = regexResult;

            switch (func) {
                case "near":
                    const nearRegex = /(\[.*]*\]),\s*(\d*)/;
                    const [, coordinate, distance] = nearRegex.exec(args);

                    // TODO: Render distance somehow
                    return renderPoint(
                        {
                            label: "query",
                            location: {
                                coordinates: JSON.parse(coordinate),
                            },
                        },
                        "blue",
                        "blue",
                    );

                case "within":
                case "contains":
                case "intersects":
                    const generalRegex = /(\[.*)/;
                    const [, coordinates] = generalRegex.exec(args);

                    // If coordinates are a polygon, draw polygon, otherwise, draw point
                    const renderFunc = coordinates
                        .replace(/[\s\n]/g, "")
                        .includes("[[[")
                        ? renderPolygon
                        : renderPoint;
                    return renderFunc(
                        {
                            label: "query",
                            location: {
                                coordinates: JSON.parse(coordinates),
                            },
                        },
                        "blue",
                        "blue",
                    );
            }
        }
    };

    /*
     * Sets current zoom level for elements
     */
    const handleZoom = (evt, position) => {
        // TODO: Need to fine tune scaling while zooming better
        setCurrentZoom(Math.log(position.zoom) || 1);
        console.log(position.zoom, Math.log(position.zoom));
    };

    const handleClose = () => setShowOptions(false);
    const handleShow = () => setShowOptions(true);

    // Render starts here
    const locations = parseResults(results);

    return (
        <>
            <div className="map-wrapper">
                {/* Options button */}
                <div className="text-right pr-5 pt-2">
                    <Button
                        variant="secondary"
                        onClick={handleShow}
                        className="options-button"
                    >
                        <i className="fa fa-cog" aria-hidden="true" />
                    </Button>
                </div>

                {/* Usage instructions */}
                {locations.length === 0 && renderInstructions()}

                <ComposableMap className="map" projection="geoEqualEarth">
                    <ZoomableGroup
                        zoom={1}
                        maxZoom={300}
                        onZoomEnd={handleZoom}
                    >
                        {/* Draw world map */}
                        <Geographies geography={mapUrl}>
                            {({ geographies }) =>
                                geographies.map(renderGeography)
                            }
                        </Geographies>
                        {/* Render records */}
                        {locations.map(renderRecord)}
                        {/* Render query */}
                        {renderQuery()}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Controls text */}
                <div className="controls-alert px-3">
                    <Alert variant="info">
                        Use CTRL + Scroll wheel to zoom and drag to pan. Touch
                        controls are also supported.
                    </Alert>
                </div>
            </div>

            {/* Options modal */}
            <Modal show={showOptions} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Options</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form.Group>
                        <Form.Check
                            label="Show Labels"
                            checked={showLabels}
                            onChange={() => setShowLabels(!showLabels)}
                        />
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPlaintextEmail">
                        <Form.Label column sm="3">
                            Map URL
                        </Form.Label>
                        <Col sm="9">
                            <Form.Control
                                onChange={m => setMapUrl(m)}
                                value={mapUrl}
                                disabled
                            />
                        </Col>
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleClose}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

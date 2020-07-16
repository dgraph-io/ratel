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
import { Form, Modal, Button, Row, Col, Alert } from "react-bootstrap";
import {
    Map,
    TileLayer,
    Polygon,
    Marker,
    Popup,
    CircleMarker,
    Circle,
} from "react-leaflet";
import Leaflet from "leaflet";

import "./GeoView.scss";

const locationField = "location";

export default function GeoView({ results }) {
    const query = useSelector(state => state.query.query);

    const [showOptions, setShowOptions] = useState(false);

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
                parsedResults.push(
                    ...data[queryKey].filter(r => r[locationField]),
                );
            }
        }

        return parsedResults;
    };

    /*
     * Instructions for how to use the geo view
     */
    const renderInstructions = () => (
        <div className="text-center px-3 pt-5 error-alert">
            <Alert variant="danger" className="mb-0">
                Your objects must contain a predicate or alias named 'location'
                to use the geo display. To show a label, use a predicate or
                alias named 'name'.
            </Alert>
        </div>
    );

    const renderRecord = record => {
        const location = record[locationField];

        switch (location.type) {
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
    const renderPoint = (record, markerColor = "blue") => {
        const location = record[locationField];
        const point = location.coordinates.slice().reverse();

        return (
            <Marker position={point} color={markerColor}>
                <Popup>{record.name || "Unnamed Marker"}</Popup>
            </Marker>
        );
    };

    /*
     * Creates a circle marker based on the location and optional label
     */
    const renderCircleMarker = (record, markerColor = "blue") => {
        const location = record[locationField];
        const point = location.coordinates.slice().reverse();

        return (
            <CircleMarker center={point} color={markerColor}>
                <Popup>{record.name || "Unnamed Marker"}</Popup>
            </CircleMarker>
        );
    };

    /*
     * Renders a polygon
     */
    const renderPolygon = (record, polygonColor = "blue") => {
        const location = record[locationField];
        const points = location.coordinates.map(a =>
            a.map(c => c.slice().reverse()),
        );

        return (
            <Polygon positions={points} color={polygonColor}>
                <Popup>{record.name || "Unnamed Polygon"}</Popup>
            </Polygon>
        );
    };

    /*
     * Renders a multipolygon
     */
    const renderMultiPolygon = record => {
        const location = record[locationField];
        let i = 0;

        return location.coordinates
            .map(p => ({
                name: `${record.name || "Unnamed MultiPolygon"} ${i++}`,
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
        const queryRegex = /func:\s*(.*)\(([^)]*)/;
        const regexResult = queryRegex.exec(query);

        if (regexResult) {
            const [, func, args] = regexResult;

            switch (func) {
                case "near":
                    const nearRegex = /(\[.*]*\]),\s*(\d*)/;
                    const [, coordinate, distance] = nearRegex.exec(args);

                    // TODO: Render distance somehow
                    return (
                        <Circle
                            center={JSON.parse(coordinate).slice().reverse()}
                            radius={JSON.parse(distance)}
                            color="red"
                        >
                            <Popup>
                                Query: {func}({args})
                            </Popup>
                        </Circle>
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
                        : renderCircleMarker;
                    return renderFunc(
                        {
                            name: `Query: ${func}(${args})`,
                            location: {
                                coordinates: JSON.parse(coordinates),
                            },
                        },
                        "red",
                    );
                default:
                    // Do nothing?
                    break;
            }
        }
    };

    const calculateBounds = records => {
        let coords = [];

        for (let record of records) {
            const location = record[locationField];

            switch (location.type) {
                case "Point":
                    coords.push(
                        Leaflet.latLng(location.coordinates.slice().reverse()),
                    );
                    break;

                case "Polygon":
                    for (let points of location.coordinates) {
                        for (let c of points) {
                            coords.push(Leaflet.latLng(c.slice().reverse()));
                        }
                    }
                    break;

                case "MultiPolygon":
                    for (let polygon of location.coordinates) {
                        for (let points of polygon) {
                            for (let c of points) {
                                coords.push(
                                    Leaflet.latLng(c.slice().reverse()),
                                );
                            }
                        }
                    }
                    break;
                default:
                    // Weird location.type -- ignore?
                    break;
            }
        }

        return Leaflet.latLngBounds(coords).pad(0.1);
    };

    const handleClose = () => setShowOptions(false);
    const handleShow = () => setShowOptions(true);

    // Render starts here
    const locations = parseResults(results);
    const bounds =
        locations.length > 0 ? calculateBounds(locations) : undefined;
    const center = locations.length > 0 ? bounds.getCenter() : [0, 0];

    return (
        <>
            <div className="map-wrapper">
                {/* Options button */}
                <div className="text-right pr-5">
                    <Button
                        variant="light"
                        onClick={handleShow}
                        className="options-button mt-2"
                    >
                        <i className="fa fa-cog" aria-hidden="true" />
                    </Button>
                </div>

                {/* Usage instructions */}
                {locations.length === 0 && renderInstructions()}

                <Map
                    zoom={19}
                    maxZoom={19}
                    center={center}
                    bounds={bounds}
                    className="map"
                >
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Render records */}
                    {locations.map(renderRecord)}
                    {/* Render query */}
                    {renderQuery()}
                </Map>
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
                                onChange={evt => setMapUrl(evt.target.value)}
                                value={mapUrl}
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

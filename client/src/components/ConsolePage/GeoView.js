/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import Leaflet from 'leaflet'
import React, { useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
} from 'react-leaflet'
import { useSelector } from 'react-redux'

import './GeoView.scss'

const locationField = 'location'

/*
 * Works out what outline, if any, to draw for the query currently in the
 * editor.
 *
 * Everything here parses text the user is part-way through typing, so it has to
 * assume the query is invalid: a near() with no distance yet, coordinates with
 * a trailing comma, a bare "within(". Drawing the outline is optional — the
 * results still render without it — so anything unparseable returns null
 * instead of throwing. It used to throw, which unmounted the whole app, and
 * since the query is persisted the blank screen came back on reload until the
 * user cleared their browser storage (#381).
 *
 * Exported for tests.
 */
export const parseGeoQuery = (query) => {
  const queryResult = /func:\s*(.*)\(([^)]*)/.exec(query || '')
  if (!queryResult) {
    return null
  }

  const [, func, args] = queryResult

  try {
    switch (func) {
      case 'near': {
        // \d+ rather than \d*: an empty match reached JSON.parse('') and threw.
        const nearResult = /(\[.*]*\]),\s*(\d+)/.exec(args)
        if (!nearResult) {
          return null
        }

        const [, coordinate, distance] = nearResult
        const radius = Number(distance)
        if (!Number.isFinite(radius) || radius <= 0) {
          return null
        }

        return {
          shape: 'circle',
          func,
          args,
          center: JSON.parse(coordinate).slice().reverse(),
          radius,
        }
      }

      case 'within':
      case 'contains':
      case 'intersects': {
        const generalResult = /(\[.*)/.exec(args)
        if (!generalResult) {
          return null
        }

        const [, coordinates] = generalResult

        return {
          shape: coordinates.replace(/[\s\n]/g, '').includes('[[[')
            ? 'polygon'
            : 'point',
          func,
          args,
          coordinates: JSON.parse(coordinates),
        }
      }

      default:
        return null
    }
  } catch (err) {
    // Malformed coordinates. Draw the results without the query outline.
    return null
  }
}

export default function GeoView({ results }) {
  const query = useSelector((state) => state.query.query)

  const [showOptions, setShowOptions] = useState(false)

  const [showLabels, setShowLabels] = useState(true)
  const [mapUrl, setMapUrl] = useState(
    'https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json',
  )

  /*
   * Parses the result object and only shows records with the location field
   * @param results - result object to parse
   */
  const parseResults = (results) => {
    const data =
      results && results.response && results.response.data
        ? results.response.data
        : {}
    const parsedResults = []

    for (var queryKey in data) {
      if (data[queryKey] instanceof Array) {
        parsedResults.push(...data[queryKey].filter((r) => r[locationField]))
      }
    }

    return parsedResults
  }

  /*
   * Instructions for how to use the geo view
   */
  const renderInstructions = () => (
    <div className='error-alert px-3 pt-5 text-center'>
      <Alert variant='danger' className='mb-0'>
        Your objects must contain a predicate or alias named 'location' to use
        the geo display. To show a label, use a predicate or alias named 'name'.
      </Alert>
    </div>
  )

  const renderRecord = (record) => {
    const location = record[locationField]

    switch (location.type) {
      case 'Point':
        return renderPoint(record)
      case 'Polygon':
        return renderPolygon(record)
      case 'MultiPolygon':
        return renderMultiPolygon(record)
      default:
      // Do nothing
    }
  }

  /*
   * Creates a marker based on the location and optional label
   */
  const renderPoint = (record, markerColor = 'blue') => {
    const location = record[locationField]
    const point = location.coordinates.slice().reverse()

    return (
      <Marker position={point} color={markerColor}>
        <Popup>{record.name || 'Unnamed Marker'}</Popup>
      </Marker>
    )
  }

  /*
   * Creates a circle marker based on the location and optional label
   */
  const renderCircleMarker = (record, markerColor = 'blue') => {
    const location = record[locationField]
    const point = location.coordinates.slice().reverse()

    return (
      <CircleMarker center={point} color={markerColor}>
        <Popup>{record.name || 'Unnamed Marker'}</Popup>
      </CircleMarker>
    )
  }

  /*
   * Renders a polygon
   */
  const renderPolygon = (record, polygonColor = 'blue') => {
    const location = record[locationField]
    const points = location.coordinates.map((a) =>
      a.map((c) => c.slice().reverse()),
    )

    return (
      <Polygon positions={points} color={polygonColor}>
        <Popup>{record.name || 'Unnamed Polygon'}</Popup>
      </Polygon>
    )
  }

  /*
   * Renders a multipolygon
   */
  const renderMultiPolygon = (record) => {
    const location = record[locationField]
    let i = 0

    return location.coordinates
      .map((p) => ({
        name: `${record.name || 'Unnamed MultiPolygon'} ${i++}`,
        location: {
          coordinates: p,
        },
      }))
      .map(renderPolygon)
  }

  /*
   * Renders the query on the map, based on the geo function used
   */
  const renderQuery = () => {
    const parsed = parseGeoQuery(query)
    if (!parsed) {
      return null
    }

    if (parsed.shape === 'circle') {
      return (
        <Circle center={parsed.center} radius={parsed.radius} color='red'>
          <Popup>
            Query: {parsed.func}({parsed.args})
          </Popup>
        </Circle>
      )
    }

    const renderFunc =
      parsed.shape === 'polygon' ? renderPolygon : renderCircleMarker

    return renderFunc(
      {
        name: `Query: ${parsed.func}(${parsed.args})`,
        location: {
          coordinates: parsed.coordinates,
        },
      },
      'red',
    )
  }

  const calculateBounds = (records) => {
    const coords = []

    for (const record of records) {
      const location = record[locationField]

      switch (location.type) {
        case 'Point':
          coords.push(Leaflet.latLng(location.coordinates.slice().reverse()))
          break

        case 'Polygon':
          for (const points of location.coordinates) {
            for (const c of points) {
              coords.push(Leaflet.latLng(c.slice().reverse()))
            }
          }
          break

        case 'MultiPolygon':
          for (const polygon of location.coordinates) {
            for (const points of polygon) {
              for (const c of points) {
                coords.push(Leaflet.latLng(c.slice().reverse()))
              }
            }
          }
          break
        default:
          // Weird location.type -- ignore?
          break
      }
    }

    return Leaflet.latLngBounds(coords).pad(0.1)
  }

  const handleClose = () => setShowOptions(false)
  const handleShow = () => setShowOptions(true)

  // Render starts here
  const locations = parseResults(results).filter((e) => e.location.type)
  const bounds = locations.length > 0 ? calculateBounds(locations) : undefined
  const center = locations.length > 0 ? bounds.getCenter() : [0, 0]

  return (
    <>
      <div className='map-wrapper'>
        {/* Options button */}
        <div className='pr-5 text-right'>
          <Button
            variant='light'
            onClick={handleShow}
            className='options-button mt-2'
          >
            <i className='fa fa-cog' aria-hidden='true' />
          </Button>
        </div>

        {/* Usage instructions */}
        {locations.length === 0 && renderInstructions()}

        <MapContainer
          zoom={19}
          maxZoom={19}
          center={center}
          bounds={bounds}
          className='map'
        >
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {/* Render records */}
          {locations.map(renderRecord)}
          {/* Render query */}
          {renderQuery()}
        </MapContainer>
      </div>

      {/* Options modal */}
      <Modal show={showOptions} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Options</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group>
            <Form.Check
              label='Show Labels'
              checked={showLabels}
              onChange={() => setShowLabels(!showLabels)}
            />
          </Form.Group>

          <Form.Group as={Row} controlId='formPlaintextEmail'>
            <Form.Label column sm='3'>
              Map URL
            </Form.Label>
            <Col sm='9'>
              <Form.Control
                onChange={(evt) => setMapUrl(evt.target.value)}
                value={mapUrl}
              />
            </Col>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
          <Button variant='primary' onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

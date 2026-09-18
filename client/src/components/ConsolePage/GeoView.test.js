/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseGeoQuery } from './GeoView'

// The query being parsed is whatever is in the editor right now, so it is
// routinely half-written. Any of these used to throw out of render, and with no
// error boundary that unmounted the app — persisted, so it survived a reload
// (#381).
describe('parseGeoQuery returns null rather than throwing on', () => {
  const cases = {
    'near with the distance deleted':
      '{ q(func: near(location, [25.0, 25.0], )) { name } }',
    'near with no distance at all':
      '{ q(func: near(location, [25.0, 25.0])) { name } }',
    'near with a zero distance':
      '{ q(func: near(location, [25.0, 25.0], 0)) { name } }',
    'near with malformed coordinates':
      '{ q(func: near(location, [25.0, ], 100)) { name } }',
    'a half-typed polygon': '{ q(func: within(location, [[[)) { name } }',
    'within with no coordinates': '{ q(func: within(location, )) { name } }',

    // JSON.parse accepts all of these; only a shape check rejects them. The
    // polygon case used to reach renderPolygon and throw "c.slice is not a
    // function", which is the same crash this function exists to prevent.
    'a polygon ring holding a bare number':
      '{ q(func: within(location, [[[1, 2], 3]])) { name } }',
    'a polygon coordinate that is not a pair':
      '{ q(func: within(location, [[[1, 2, 3], [4, 5]]])) { name } }',
    'a polygon with string coordinates':
      '{ q(func: within(location, [[["a", "b"]]])) { name } }',
    'a point that is not a pair':
      '{ q(func: contains(location, [1, 2, 3])) { name } }',
    'a point with string coordinates':
      '{ q(func: contains(location, ["a", "b"])) { name } }',
    'near with a non-pair centre':
      '{ q(func: near(location, [25.0], 5000)) { name } }',

    // Unanchored, this captured 5000 and drew a circle for a query the server
    // rejects outright.
    'near with trailing junk after the distance':
      '{ q(func: near(location, [25.0, 25.0], 5000junk)) { name } }',
    'a non-geo function': '{ q(func: has(name)) { name } }',
    'an empty query': '',
    'no query at all': undefined,
  }

  for (const [name, query] of Object.entries(cases)) {
    test(name, () => {
      expect(parseGeoQuery(query)).toBeNull()
    })
  }
})

describe('parseGeoQuery still parses valid queries', () => {
  test('near gives a circle with lat/lng reversed for Leaflet', () => {
    expect(
      parseGeoQuery('{ q(func: near(location, [25.5, 26.5], 5000)) { name } }'),
    ).toMatchObject({
      shape: 'circle',
      func: 'near',
      center: [26.5, 25.5],
      radius: 5000,
    })
  })

  test('within with a polygon', () => {
    expect(
      parseGeoQuery(
        '{ q(func: within(location, [[[1.0, 2.0], [3.0, 4.0], [1.0, 2.0]]])) { name } }',
      ),
    ).toMatchObject({ shape: 'polygon', func: 'within' })
  })

  test('contains with a single point', () => {
    expect(
      parseGeoQuery('{ q(func: contains(location, [1.0, 2.0])) { name } }'),
    ).toMatchObject({ shape: 'point', func: 'contains', coordinates: [1, 2] })
  })
})

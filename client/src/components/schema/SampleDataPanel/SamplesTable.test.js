/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import Adapter from '@wojtekmaj/enzyme-adapter-react-17'
import Enzyme from 'enzyme'
import { mount } from 'enzyme'
import React from 'react'

import SamplesTable from './SamplesTable'

Enzyme.configure({ adapter: new Adapter() })

test("SamplesTable shouldn't crash on scalars or nested objects", () => {
  const samples = [
    {
      uid: 333,
      stringVal: 's',
      intVal: 100,
      loc: { type: 'Point', coords: [1, 2, 3] },
      arr: [{ uid: 1 }, { uid: 2 }],
    },
  ]
  const wrapper = mount(
    <SamplesTable
      executeQuery={async function () {
        return {
          data: {
            samples,
            nodeCount: [{ nodeCount: 10 }],
          },
        }
      }}
      predicate={{ predicate: 'foo' }}
    />,
  )
  wrapper.setState({ samples })
  // 4 properties - string, int, loc, arr
  expect(wrapper.find('tr').length).toEqual(4)
})

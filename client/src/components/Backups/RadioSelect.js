/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export default function RadioSelect({
  value,
  onChange,
  radioItems,
  itemLabels,
}) {
  return (
    <React.Fragment>
      {radioItems.map((item, index) => (
        <Col sm={12} key={'radio-' + item}>
          <Form.Check
            type='radio'
            checked={item === value}
            id={'radio-' + item}
            label={(itemLabels && itemLabels[index]) || item}
            onChange={() => onChange(item)}
          />
        </Col>
      ))}
    </React.Fragment>
  )
}

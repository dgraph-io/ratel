/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import classnames from 'classnames'
import React from 'react'
import Button from 'react-bootstrap/Button'

import Label from './Label'

import 'assets/css/EntitySelector.scss'

export default class EntitySelector extends React.Component {
  state = { expanded: false }

  render() {
    const {
      graphLabels,
      onPredicateHovered,
      hiddenPredicates,
      onPredicateToggled,
    } = this.props
    const { expanded } = this.state

    return (
      <div className={classnames('entity-selector', { expanded })}>
        <Button
          className='toggle'
          onClick={() => this.setState({ expanded: !expanded })}
        >
          &#x25B2;
        </Button>
        {graphLabels.map((label) => {
          const hidden = hiddenPredicates && hiddenPredicates.has(label.pred)
          return (
            <Label
              key={label.pred}
              color={label.color}
              pred={label.pred}
              label={label.label}
              hidden={hidden}
              title={
                hidden
                  ? `Show ${label.pred} in the graph`
                  : `Hide ${label.pred} from the graph`
              }
              onClick={
                onPredicateToggled
                  ? () => onPredicateToggled(label.pred)
                  : undefined
              }
              onMouseEnter={() => onPredicateHovered(label.pred)}
              onMouseLeave={() => onPredicateHovered()}
            />
          )
        })}
      </div>
    )
  }
}

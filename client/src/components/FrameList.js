/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import FrameItem from './FrameItem'

import '../assets/css/Frames.scss'

export default class FrameList extends React.Component {
  state = {
    count: 10,
  }

  loadMore = () => {
    this.setState((state) => ({
      count: state.count + 10,
    }))
  }

  render() {
    const { activeFrameId, frames } = this.props
    const { count } = this.state

    const finalFrames = frames.slice(0, count)
    const loadMoreButton = frames.length > count && (
      <button
        className='btn btn-default btn-load-more'
        onClick={this.loadMore}
        style={{ marginTop: 10 }}
      >
        Load older queries
      </button>
    )

    return (
      <div className='frame-list-outer'>
        {finalFrames.map((frame) => (
          <FrameItem
            key={frame.id}
            activeFrameId={activeFrameId}
            frame={frame}
            collapsed={true}
          />
        ))}
        {loadMoreButton}
      </div>
    )
  }
}

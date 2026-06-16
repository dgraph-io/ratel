/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import Modal from 'react-bootstrap/Modal'

import { latencyBarSegments, numUidSegments, timeToText } from 'lib/latency'

import './LatencyModal.scss'

// Phase colors mirror the inline latency bar (.latency-seg--* in
// FrameHeader.scss).
const PHASE_COLOR = {
  parsing: '#74b074',
  processing: '#e0a960',
  encoding: '#cc6b68',
  assign_timestamp: '#a974c0',
  network: '#5b8bb5',
}

// Segment keys for server phases carry an "_ns" suffix (parsing_ns, ...);
// network does not. Normalize before looking up the color.
const colorFor = (key) => PHASE_COLOR[key.replace(/_ns$/, '')] || '#5b8bb5'

export default function LatencyModal({ result, onHide }) {
  const segments = latencyBarSegments(
    result.serverLatency,
    result.networkLatencyNs,
  )
  const totalNs = segments.reduce((sum, s) => sum + s.ns, 0)

  // Lay the phases out as a timeline/waterfall: each bar starts where the
  // previous phase ended, so the row reads as a sequence over the total
  // duration rather than five independent bars from zero.
  let elapsedNs = 0
  const timeline = segments.map((s) => {
    const offset = totalNs > 0 ? elapsedNs / totalNs : 0
    elapsedNs += s.ns
    return { ...s, offset }
  })

  const { segments: uidSegments, total: uidTotal } = numUidSegments(
    result.response && result.response.data,
  )

  return (
    <Modal
      centered
      show={true}
      size='lg'
      onHide={onHide}
      dialogClassName='latency-modal'
    >
      <Modal.Header closeButton>
        <Modal.Title>Query latency breakdown</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {segments.length === 0 ? (
          <p className='latency-modal__empty'>
            No latency data for this query.
          </p>
        ) : (
          <div className='latency-modal__section'>
            <div className='latency-modal__section-title'>Latency</div>
            {timeline.map((s) => (
              <div className='latency-modal__row' key={s.key}>
                <span className='latency-modal__label'>{s.label}</span>
                <span className='latency-modal__track'>
                  <span
                    className='latency-modal__bar latency-modal__bar--timeline'
                    style={{
                      left: `${s.offset * 100}%`,
                      width: `${Math.max(s.ratio * 100, 0.5)}%`,
                      backgroundColor: colorFor(s.key),
                    }}
                  />
                </span>
                <span className='latency-modal__value'>{s.text}</span>
                <span className='latency-modal__pct'>
                  {(s.ratio * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            <div className='latency-modal__row latency-modal__row--total'>
              <span className='latency-modal__label'>Total</span>
              <span className='latency-modal__track latency-modal__track--rule' />
              <span className='latency-modal__value'>
                {timeToText(totalNs)}
              </span>
              <span className='latency-modal__pct' />
            </div>
          </div>
        )}

        {uidSegments.length > 0 && (
          <div className='latency-modal__section'>
            <div className='latency-modal__section-title'>
              Num UIDs
              <span className='latency-modal__section-total'>
                total: {uidTotal.toLocaleString()}
              </span>
            </div>
            {uidSegments.map((s) => (
              <div className='latency-modal__row' key={s.key}>
                <span className='latency-modal__label' title={s.key}>
                  {s.key}
                </span>
                <span className='latency-modal__track'>
                  <span
                    className='latency-modal__bar'
                    style={{
                      width: `${Math.max(s.ratio * 100, 0.5)}%`,
                      backgroundColor: '#5b8bb5',
                    }}
                  />
                </span>
                <span className='latency-modal__value'>
                  {s.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}

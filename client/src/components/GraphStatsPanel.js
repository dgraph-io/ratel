/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import './GraphStatsPanel.scss'

const formatNumber = (n, digits = 2) =>
  Number.isFinite(n) ? n.toFixed(digits) : '—'

const formatPercent = (n) =>
  Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : '—'

// Computes, from a stats summary, the visible histogram bar heights so the
// panel can render them without keeping the full data array in JSX.
function histogramBars(histogram) {
  if (!histogram || histogram.length === 0) {
    return []
  }
  let max = 0
  for (const bin of histogram) {
    if (bin.count > max) max = bin.count
  }
  if (max === 0) {
    return histogram.map((bin) => ({ ...bin, heightPct: 0 }))
  }
  return histogram.map((bin) => ({
    ...bin,
    heightPct: (bin.count / max) * 100,
  }))
}

// Read-only panel that summarises the currently visible graph: counts,
// degree statistics, connected components, density, reciprocity, a
// degree-distribution histogram, and the top hubs by degree and betweenness.
export default function GraphStatsPanel({
  summary,
  topByDegree,
  topByBetweenness,
  onClose,
}) {
  if (!summary) {
    return (
      <div className='graph-stats-panel'>
        <div className='graph-stats-panel__header'>
          <span>Graph statistics</span>
          <button
            type='button'
            className='graph-stats-panel__close'
            onClick={onClose}
            title='Close'
            aria-label='Close statistics'
          >
            ×
          </button>
        </div>
        <div className='graph-stats-panel__empty'>No graph loaded.</div>
      </div>
    )
  }

  const bars = histogramBars(summary.degreeHistogram)
  const totalHistogramNodes = bars.reduce((acc, b) => acc + b.count, 0)

  return (
    <div className='graph-stats-panel'>
      <div className='graph-stats-panel__header'>
        <span>Graph statistics</span>
        <button
          type='button'
          className='graph-stats-panel__close'
          onClick={onClose}
          title='Close'
          aria-label='Close statistics'
        >
          ×
        </button>
      </div>

      <div className='graph-stats-panel__section'>Overview</div>
      <dl className='graph-stats-panel__kv'>
        <dt>Nodes</dt>
        <dd>{summary.nodes}</dd>
        <dt>Edges</dt>
        <dd>{summary.edges}</dd>
        <dt>Density</dt>
        <dd>{formatPercent(summary.density)}</dd>
        <dt>Reciprocity</dt>
        <dd>{formatPercent(summary.reciprocity)}</dd>
      </dl>

      <div className='graph-stats-panel__section'>Connected components</div>
      <dl className='graph-stats-panel__kv'>
        <dt>Components</dt>
        <dd>{summary.components.count}</dd>
        <dt>Largest</dt>
        <dd>{summary.components.largest}</dd>
      </dl>

      <div className='graph-stats-panel__section'>Degree</div>
      <dl className='graph-stats-panel__kv'>
        <dt>Average</dt>
        <dd>{formatNumber(summary.degree.avg)}</dd>
        <dt>Median</dt>
        <dd>{formatNumber(summary.degree.median)}</dd>
        <dt>Min / Max</dt>
        <dd>
          {summary.degree.min} / {summary.degree.max}
        </dd>
      </dl>

      {bars.length > 0 && (
        <>
          <div className='graph-stats-panel__section'>
            Degree distribution ({totalHistogramNodes} nodes)
          </div>
          <div
            className='graph-stats-panel__histogram'
            role='img'
            aria-label='Degree distribution histogram'
          >
            {bars.map((bin) => (
              <div
                key={`${bin.range[0]}-${bin.range[1]}`}
                className='graph-stats-panel__histogram-bar'
                title={`${bin.range[0]}–${bin.range[1]}: ${bin.count} nodes`}
              >
                <div
                  className='graph-stats-panel__histogram-fill'
                  style={{ height: `${bin.heightPct}%` }}
                />
                <div className='graph-stats-panel__histogram-count'>
                  {bin.count}
                </div>
              </div>
            ))}
          </div>
          <div className='graph-stats-panel__histogram-axis'>
            <span>{bars[0].range[0]}</span>
            <span>{bars[bars.length - 1].range[1]}</span>
          </div>
        </>
      )}

      <div className='graph-stats-panel__section'>Top by degree</div>
      <ol className='graph-stats-panel__rank'>
        {topByDegree.length === 0 ? (
          <li className='graph-stats-panel__rank-empty'>—</li>
        ) : (
          topByDegree.map((entry) => (
            <li key={entry.uid} title={entry.label}>
              <span className='graph-stats-panel__rank-label'>
                {entry.label}
              </span>
              <span className='graph-stats-panel__rank-value'>
                {entry.value}
              </span>
            </li>
          ))
        )}
      </ol>

      {topByBetweenness && (
        <>
          <div className='graph-stats-panel__section'>Top by betweenness</div>
          <ol className='graph-stats-panel__rank'>
            {topByBetweenness.length === 0 ? (
              <li className='graph-stats-panel__rank-empty'>—</li>
            ) : (
              topByBetweenness.map((entry) => (
                <li key={entry.uid} title={entry.label}>
                  <span className='graph-stats-panel__rank-label'>
                    {entry.label}
                  </span>
                  <span className='graph-stats-panel__rank-value'>
                    {formatNumber(entry.value, 3)}
                  </span>
                </li>
              ))
            )}
          </ol>
        </>
      )}
    </div>
  )
}

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { updateQuery, updateQueryVars } from 'actions/query'
import { extractVars } from 'lib/parsers/queryVars'
import './index.scss'

const DEMO_QUERY = `
query myDemoQuery($terms: string) {
  films(func: allofterms(name@en, $terms)) {
    uid
    name@en
    genre { name@en }
  }
}`.trim()
const DEMO_VAR = 'terms: Indiana Jones'

const findNewVars = (userVars, detectedVars) => {
  const user = new Set(userVars.map((x) => x[1].split(':')?.[0]))
  return detectedVars.filter((x) => !user.has(x[0]))
}

function sampleFor(typeName) {
  const sampleDict = {
    bool: 'true',
    datetime: '2020-06-11T19:59:05',
    float: '36.6',
    int: '1023',
    string: 'some text',
  }
  return sampleDict[typeName.toLowerCase()] || '100'
}

function haveQueryVarsInHistory(frameItems) {
  try {
    const varFrames = (frameItems || [])
      .slice(0, 100)
      .filter((f) => f.action === 'query')
      .filter((f) => extractVars(f.query.substring(0, 1000)).length)

    return varFrames.length > 2
  } catch (e) {
    return false
  }
}

export default function QueryVarsEditor() {
  const { queryVars, query } = useSelector((state) => state.query)
  const dispatch = useDispatch()
  const { items: frameItems } = useSelector((state) => state.frames)

  const vars = extractVars(query)
  const newVars = findNewVars(queryVars, vars)

  const deleteVar = (indx) =>
    dispatch(
      updateQueryVars([
        ...queryVars.slice(0, indx),
        ...queryVars.slice(indx + 1, queryVars.length),
      ]),
    )

  const spawnVar = (val) =>
    dispatch(updateQueryVars([[true, val], ...queryVars]))

  const smartSpawnVars = () =>
    dispatch(
      updateQueryVars([
        ...newVars.map((x) => [true, `${x[0]}: ${sampleFor(x[1])}`]),
        ...queryVars,
      ]),
    )

  const editVar = (indx, newValue) =>
    dispatch(
      updateQueryVars([
        ...queryVars.slice(0, indx),
        [queryVars[indx][0], newValue],
        ...queryVars.slice(indx + 1, queryVars.length),
      ]),
    )

  const setChecked = (indx, isChecked) =>
    dispatch(
      updateQueryVars([
        ...queryVars.slice(0, indx),
        [isChecked, queryVars[indx][1]],
        ...queryVars.slice(indx + 1, queryVars.length),
      ]),
    )

  const dropAllVars = () => dispatch(updateQueryVars([]))

  const summary = () => {
    if (!queryVars.length) {
      return ''
    }
    const checked = queryVars.filter((q) => q[0]).length
    return `   ${checked} / ${queryVars.length}`
  }

  return (
    <div className='query-vars-editor'>
      <button
        className='btn'
        title='Add Query Variable'
        onClick={() => {
          if (newVars.length) {
            smartSpawnVars()
          } else {
            if (!haveQueryVarsInHistory(frameItems)) {
              spawnVar(DEMO_VAR)
              dispatch(updateQuery(DEMO_QUERY))
            } else {
              spawnVar(`var: ${queryVars.length + 1}`)
            }
          }
        }}
      >
        {newVars.length ? (
          <span className='text-primary'>
            <i className='fas fa-lightbulb' /> Add {newVars.length}{' '}
            {newVars.length === 1 ? 'variable' : 'variables'}
          </span>
        ) : (
          <>
            <i className='fas fa-plus-circle' /> Variable
          </>
        )}
      </button>
      <span className='count'>{summary()}</span>

      {queryVars.length > 0 && (
        <button
          className='btn btn-drop-all'
          title='Remove All Variables'
          onClick={dropAllVars}
        >
          <i className='fas fa-trash-alt' /> remove all
        </button>
      )}
      <div className='vars'>
        {queryVars.map(([checked, val], i) => (
          <div className='var' key={i}>
            <div className='controls'>
              <button className='delete' onClick={() => deleteVar(i)}>
                <i className='fas fa-trash-alt' />
              </button>
              <input
                type='checkbox'
                className='checkbox-send'
                checked={checked}
                onChange={() => setChecked(i, !checked)}
              />
            </div>
            <div className='content'>
              <input
                className='edit-var'
                type='text'
                value={val}
                onChange={(e) => editVar(i, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { runQuery } from 'actions/frames'
import { updateQueryAndAction, updateQueryVars } from 'actions/query'
import { OK } from 'lib/constants'
import { getDgraphClient } from 'lib/helpers'

import './lib/schema.js'
import './lib/schema-loader.js'
import './lib/query-parser.js'
import './lib/app.js'
import './lib/styles.css'
import './QueryBuilder.scss'

/**
 * Convert builder variables JSON into Ratel's queryVars shape:
 * [[checked, "name: value"], ...]
 */
export function builderVarsToQueryVars(varsText) {
  if (!varsText || !String(varsText).trim()) {
    return []
  }
  try {
    const parsed = JSON.parse(varsText)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return []
    }
    const entries = Object.entries(parsed)
    if (
      entries.length &&
      entries.every(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
    ) {
      const first = entries[0][1]
      return Object.entries(first).map(([key, value]) => {
        const name = String(key).replace(/^\$/, '')
        return [true, `${name}: ${value}`]
      })
    }
    return entries.map(([key, value]) => {
      const name = String(key).replace(/^\$/, '')
      return [true, `${name}: ${value}`]
    })
  } catch {
    return []
  }
}

function SchemaStatus({ state, errorMsg, typeCount, onRetry }) {
  if (state === 'loading') {
    return (
      <span className='qb-status is-loading'>
        <i className='fas fa-circle-notch fa-spin' /> Loading schema…
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className='qb-status is-error'>
        {errorMsg || 'Failed to load schema'}
        <button type='button' className='qb-link-btn' onClick={onRetry}>
          Retry
        </button>
      </span>
    )
  }
  if (state === 'empty') {
    return (
      <span className='qb-status is-warn'>
        No types found — add types in Schema first.
      </span>
    )
  }
  if (state === 'ok') {
    return (
      <span className='qb-status is-ok'>
        {typeCount} type{typeCount === 1 ? '' : 's'} loaded
      </span>
    )
  }
  return <span className='qb-status'>Connect to load schema.</span>
}

/**
 * Visual canvas for building DQL.
 * In Console (`embedded`), only the canvas mounts here — DQL/vars use Ratel's editors.
 */
const QueryBuilder = forwardRef(function QueryBuilder(
  { embedded = false, syncToStore = true },
  ref,
) {
  const dispatch = useDispatch()
  const currentServer = useSelector(
    (state) => state.connection.serverHistory[0],
  )
  const { readOnly, bestEffort } = useSelector((state) => state.query)

  const rootRef = useRef(null)
  const apiRef = useRef(null)
  const latestQueryRef = useRef({ query: '', variables: '' })
  // When the text editor drives an import, don't let canvas→store sync
  // overwrite the user's in-progress DQL with regenerated text.
  const pauseStoreSyncRef = useRef(false)
  const [builderReady, setBuilderReady] = useState(false)

  const [schemaState, setSchemaState] = useState('idle')
  const [schemaError, setSchemaError] = useState('')
  const [typeCount, setTypeCount] = useState(0)
  const [hasQuery, setHasQuery] = useState(false)

  const canQuery = currentServer?.aclState === OK

  const syncStore = useCallback(
    (query, variables) => {
      if (!syncToStore || pauseStoreSyncRef.current) {
        return
      }
      const text = (query || '').trim()
      if (!text || text.startsWith('#')) {
        dispatch(updateQueryAndAction('', 'query'))
        dispatch(updateQueryVars([]))
        return
      }
      dispatch(updateQueryAndAction(text, 'query'))
      dispatch(updateQueryVars(builderVarsToQueryVars(variables)))
    },
    [dispatch, syncToStore],
  )

  const onQueryChange = useCallback(
    ({ query, variables }) => {
      latestQueryRef.current = {
        query: query || '',
        variables: variables || '',
      }
      const text = (query || '').trim()
      setHasQuery(!!text && !text.startsWith('#'))
      syncStore(query, variables)
    },
    [syncStore],
  )

  const applySchemaPayload = useCallback((payload) => {
    const loader = window.DQLSchemaLoader
    if (!loader || !apiRef.current) {
      return
    }
    try {
      const entities = loader.fromSchemaJson(payload)
      const count = Object.keys(entities).length
      setTypeCount(count)
      if (!count) {
        setSchemaState('empty')
        apiRef.current.setSchema({}, { clearCanvas: true })
        return
      }
      apiRef.current.applyLoadedSchema(entities, 'connected Alpha')
      setSchemaState('ok')
      setSchemaError('')
    } catch (err) {
      setSchemaState('error')
      setSchemaError(err?.message || String(err))
    }
  }, [])

  const fetchSchema = useCallback(async () => {
    if (!canQuery || !apiRef.current) {
      if (!canQuery) {
        setSchemaState('idle')
      }
      return
    }
    setSchemaState('loading')
    setSchemaError('')
    try {
      const client = await getDgraphClient()
      const response = await client.newTxn().query('schema {}')
      const data = response.data || response
      const types = data.types || data.Types || []
      if (!types.length) {
        setTypeCount(0)
        setSchemaState('empty')
        apiRef.current.setSchema({}, { clearCanvas: true })
        setSchemaError('')
        return
      }
      applySchemaPayload(data)
    } catch (err) {
      console.error(err)
      setSchemaState('error')
      setSchemaError(`Error fetching schema from Alpha: ${err?.message || err}`)
    }
  }, [applySchemaPayload, canQuery])

  useEffect(() => {
    let cancelled = false
    let api = null

    async function boot() {
      if (cancelled || !rootRef.current || !window.DQLBuilder?.mount) {
        return
      }
      api = window.DQLBuilder.mount(rootRef.current, {
        hideSchemaControls: true,
        persistWorkspace: true,
        canvasOnly: embedded,
        onQueryChange,
      })
      apiRef.current = api
      if (!cancelled) {
        setBuilderReady(true)
      }
    }

    boot()

    return () => {
      cancelled = true
      setBuilderReady(false)
      api?.destroy?.()
      apiRef.current = null
    }
  }, [embedded, onQueryChange])

  useEffect(() => {
    if (!builderReady) {
      return
    }
    fetchSchema()
  }, [
    builderReady,
    canQuery,
    currentServer?.url,
    currentServer?.refreshToken,
    currentServer?.aclState,
    fetchSchema,
  ])

  const getBuiltQuery = useCallback(() => {
    const text = (
      apiRef.current?.getQuery?.() ||
      latestQueryRef.current.query ||
      ''
    ).trim()
    const varsText =
      apiRef.current?.getVars?.() || latestQueryRef.current.variables || ''
    return {
      query: text,
      queryVars: builderVarsToQueryVars(varsText),
      ready: !!text && !text.startsWith('#'),
    }
  }, [])

  const runBuiltQuery = useCallback(() => {
    const { query, queryVars, ready } = getBuiltQuery()
    if (!ready) {
      return false
    }
    dispatch(updateQueryAndAction(query, 'query'))
    dispatch(updateQueryVars(queryVars))
    dispatch(
      runQuery(query, 'query', {
        queryVars,
        readOnly,
        bestEffort,
      }),
    )
    return true
  }, [bestEffort, dispatch, getBuiltQuery, readOnly])

  const clearBuilder = useCallback(() => {
    if (apiRef.current?.clearCanvas) {
      apiRef.current.clearCanvas()
    } else {
      rootRef.current?.querySelector('#clearBtn')?.click()
    }
    dispatch(updateQueryAndAction('', 'query'))
    dispatch(updateQueryVars([]))
    setHasQuery(false)
  }, [dispatch])

  const importQuery = useCallback(
    (text) => {
      if (!apiRef.current?.importQuery) {
        return false
      }
      pauseStoreSyncRef.current = true
      try {
        const ok = apiRef.current.importQuery(text)
        if (ok) {
          const vars = apiRef.current.getVars?.() || ''
          latestQueryRef.current = {
            query: text || '',
            variables: vars,
          }
          // Keep the editor's text; only refresh variable bindings from canvas.
          dispatch(updateQueryVars(builderVarsToQueryVars(vars)))
          const trimmed = String(text || '').trim()
          setHasQuery(!!trimmed && !trimmed.startsWith('#'))
        }
        return ok
      } finally {
        pauseStoreSyncRef.current = false
      }
    },
    [dispatch],
  )

  useImperativeHandle(
    ref,
    () => ({
      run: runBuiltQuery,
      clear: clearBuilder,
      hasQuery: () => hasQuery || getBuiltQuery().ready,
      getBuiltQuery,
      importQuery,
      refreshSchema: fetchSchema,
    }),
    [
      clearBuilder,
      fetchSchema,
      getBuiltQuery,
      hasQuery,
      importQuery,
      runBuiltQuery,
    ],
  )

  return (
    <div
      className={
        embedded
          ? 'query-builder-view is-embedded is-ratel'
          : 'query-builder-view'
      }
    >
      {!embedded && (
        <div className='query-builder-toolbar'>
          <div className='query-builder-toolbar-left'>
            <h2>Query Builder</h2>
            <SchemaStatus
              state={canQuery ? schemaState : 'idle'}
              errorMsg={schemaError}
              typeCount={typeCount}
              onRetry={fetchSchema}
            />
          </div>
          <div className='query-builder-toolbar-right'>
            <button
              type='button'
              className='btn btn-sm btn-secondary'
              disabled={!canQuery}
              onClick={fetchSchema}
              title='Reload schema from the connected Alpha'
            >
              <i className='fas fa-sync-alt' /> Refresh schema
            </button>
          </div>
        </div>
      )}

      {!canQuery && (
        <div className='alert alert-warning query-builder-alert'>
          You must be connected (and logged in, if ACL is enabled) to load
          schema and run queries.
        </div>
      )}

      <div
        className={
          embedded
            ? 'dql-builder app query-builder-host ratel-theme canvas-only'
            : 'dql-builder app query-builder-host'
        }
        ref={rootRef}
      >
        <div className='canvas-wrap'>
          <div className='panel-label'>
            <span className='canvas-label-left'>
              <span>Canvas</span>
              {embedded && (
                <SchemaStatus
                  state={canQuery ? schemaState : 'idle'}
                  errorMsg={schemaError}
                  typeCount={typeCount}
                  onRetry={fetchSchema}
                />
              )}
            </span>
            <div className='panel-actions'>
              <div className='entity-menu' id='entityMenuWrap'>
                <button
                  type='button'
                  id='addEntityBtn'
                  className='btn-ghost btn-add-entity'
                  aria-haspopup='true'
                  aria-expanded='false'
                >
                  + Add entity
                </button>
                <div
                  id='entityMenu'
                  className='entity-menu-panel'
                  hidden
                  role='menu'
                  aria-label='Add entity'
                />
              </div>
              {embedded && (
                <button
                  type='button'
                  className='btn-ghost'
                  disabled={!canQuery}
                  onClick={fetchSchema}
                  title='Reload schema from the connected Alpha'
                >
                  <i className='fas fa-sync-alt' /> Refresh
                </button>
              )}
              <button type='button' id='clearBtn' className='btn-ghost'>
                Clear
              </button>
            </div>
          </div>
          <div id='canvas' className='canvas' tabIndex={0}>
            <div
              id='canvasSurface'
              className='canvas-surface'
              aria-hidden='true'
            />
            <div className='canvas-empty' id='canvasEmpty'>
              {canQuery
                ? 'Add an entity to start building a query.'
                : 'Connect to Dgraph to start building queries.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default QueryBuilder

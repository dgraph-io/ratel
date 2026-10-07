/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import { executeQuery } from 'lib/helpers'
import {
  PROVIDERS,
  PROVIDER_IDS,
  generateDql,
  loadAiSettings,
  saveAiSettings,
  schemaSummary,
} from 'lib/nl2dql'

// "Generate query with AI": natural language -> DQL, bring-your-own-key.
// The key is kept in localStorage and requests go straight from the
// browser to the model API.
export default function AiQueryModal({ show, onHide, onInsert }) {
  const [settings, setSettings] = React.useState(loadAiSettings)
  const [request, setRequest] = React.useState('')
  const [generated, setGenerated] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState(null)

  const provider = settings.provider
  const providerDef = PROVIDERS[provider]
  const current = settings[provider]

  const updateSettings = (change) => {
    const next = { ...settings, ...change }
    setSettings(next)
    saveAiSettings(next)
  }

  const updateProviderSettings = (change) =>
    updateSettings({ [provider]: { ...current, ...change } })

  const handleGenerate = async () => {
    setBusy(true)
    setError(null)
    setGenerated('')
    try {
      let schemaText = ''
      try {
        const schemaResponse = await executeQuery('schema {}', {
          action: 'query',
        })
        schemaText = schemaSummary(schemaResponse)
      } catch {
        // Schema is optional context; generate without it.
      }

      const dql = await generateDql({
        provider,
        apiKey: current.apiKey,
        model: current.model,
        schemaText,
        request,
      })
      setGenerated(dql)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleInsert = () => {
    onInsert(generated)
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>Generate query with AI</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Provider</Form.Label>
          <Form.Control
            as='select'
            value={provider}
            onChange={(e) => updateSettings({ provider: e.target.value })}
          >
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDERS[id].label}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group>
          <Form.Label>{providerDef.label} API key</Form.Label>
          <Form.Control
            type='password'
            placeholder={providerDef.keyPlaceholder}
            value={current.apiKey}
            onChange={(e) => updateProviderSettings({ apiKey: e.target.value })}
          />
          <Form.Text className='text-muted'>
            Stored only in this browser, per provider. Requests go directly to
            the model API; your data never passes through the Ratel server.
          </Form.Text>
        </Form.Group>

        <Form.Group>
          <Form.Label>Model</Form.Label>
          <Form.Control
            as='select'
            value={current.model}
            onChange={(e) => updateProviderSettings({ model: e.target.value })}
          >
            {providerDef.models.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group>
          <Form.Label>Describe the query you want</Form.Label>
          <Form.Control
            as='textarea'
            rows={3}
            placeholder='e.g. the 10 most recently added people and their friends'
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            disabled={busy}
          />
          <Form.Text className='text-muted'>
            The current schema is sent along as context.
          </Form.Text>
        </Form.Group>

        {error && <div className='alert alert-danger'>{error}</div>}

        {generated && (
          <Form.Group>
            <Form.Label>Generated DQL</Form.Label>
            <Form.Control
              as='textarea'
              rows={8}
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant='primary'
          onClick={handleGenerate}
          disabled={busy || !request.trim() || !current.apiKey}
        >
          {busy ? 'Generating…' : 'Generate'}
        </Button>
        <Button variant='success' onClick={handleInsert} disabled={!generated}>
          Insert into editor
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

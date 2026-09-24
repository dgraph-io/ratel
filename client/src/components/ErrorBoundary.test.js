/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import ErrorBoundary from './ErrorBoundary'

const Boom = ({ explode }) => {
  if (explode) {
    throw new Error('kaboom')
  }
  return <div>rendered fine</div>
}

// React logs caught errors itself, which is noise here.
let consoleError
beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => consoleError.mockRestore())

test('renders children when nothing throws', () => {
  render(
    <ErrorBoundary resetKey='a'>
      <Boom explode={false} />
    </ErrorBoundary>,
  )

  expect(screen.getByText('rendered fine')).toBeInTheDocument()
})

test('shows the error instead of unmounting when a child throws', () => {
  const { container } = render(
    <ErrorBoundary resetKey='a'>
      <Boom explode={true} />
    </ErrorBoundary>,
  )

  expect(
    screen.getByText(/Something went wrong displaying this result/),
  ).toBeInTheDocument()
  // Asserted against the container rather than by text: the message appears in
  // both the summary line and the stack trace below it.
  expect(container.textContent).toContain('kaboom')
})

test('recovers when resetKey changes, so fixing the query is enough', () => {
  const { rerender } = render(
    <ErrorBoundary resetKey='a'>
      <Boom explode={true} />
    </ErrorBoundary>,
  )
  expect(
    screen.getByText(/Something went wrong displaying this result/),
  ).toBeInTheDocument()

  rerender(
    <ErrorBoundary resetKey='b'>
      <Boom explode={false} />
    </ErrorBoundary>,
  )

  expect(screen.getByText('rendered fine')).toBeInTheDocument()
  expect(
    screen.queryByText(/Something went wrong displaying this result/),
  ).not.toBeInTheDocument()
})

test('stays in the error state while resetKey is unchanged', () => {
  const { rerender } = render(
    <ErrorBoundary resetKey='a'>
      <Boom explode={true} />
    </ErrorBoundary>,
  )

  rerender(
    <ErrorBoundary resetKey='a'>
      <Boom explode={false} />
    </ErrorBoundary>,
  )

  expect(
    screen.getByText(/Something went wrong displaying this result/),
  ).toBeInTheDocument()
})

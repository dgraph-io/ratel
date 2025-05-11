/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import {
  createHttpClient,
  createTestTab,
  easyUid,
  setupBrowser,
  typeAndRun,
  waitForActiveTab,
  waitForEditor,
  waitForElement,
} from './puppetHelpers'

import { ensureLoggedIn } from './acl/aclHelpers'

let browser = null
let page = null

beforeAll(async () => {
  jest.setTimeout(10000)
  jest.retryTimes(5)

  browser = await setupBrowser()
  page = await createTestTab(browser)

  await ensureLoggedIn(page)
})

afterAll(async () => browser && (await browser.close()))

test('Should draw one to one nodes', async () => {
  const testId = `testRun${easyUid()}`

  const httpClient = await createHttpClient()
  await httpClient.alter({ schema: `${testId}: uid .` })
  await httpClient.newTxn().mutate({
    setJson: {
      [testId + '_name']: 'Alice',
      [testId]: {
        [testId + '_name']: 'Bob',
      },
    },
    commitNow: true,
  })

  await typeAndRun(
    page,
    `{
            query(func: has(${testId})) {
              uid
              ${testId} { uid }
    `,
  )

  const summarySelector = '.graph-overlay .title'
  await waitForElement(page, summarySelector)

  await expect(
    page.$eval(summarySelector, (el) => el.textContent),
  ).resolves.toBe('Showing 2 nodes and 1 edges')
})

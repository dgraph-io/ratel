/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
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
  waitForFramePreview,
} from './puppetHelpers'

import { ensureLoggedIn } from './acl/aclHelpers'

let browser = null
let page = null

beforeAll(async () => {
  jest.setTimeout(30000)
  jest.retryTimes(5)

  browser = await setupBrowser()
  page = await createTestTab(browser)

  await ensureLoggedIn(page)
})

afterAll(async () => browser && (await browser.close()))

test('Should draw one to one nodes', async () => {
  const testId = `testRun${easyUid()}`

  const httpClient = await createHttpClient()
  await httpClient.alter({ schema: `${testId}_money: int .` })
  await httpClient.newTxn().mutate({
    setJson: {
      [testId + '_money']: '1193880128115965952',
    },
    commitNow: true,
  })

  await typeAndRun(
    page,
    `{
            query(func: has(${testId}_money)) {
              uid
              ${testId}_money
    `,
  )

  await expect(
    waitForFramePreview(page, `${testId}_money`),
  ).resolves.toBeTruthy()

  // Wait for the response to finish rendering — the frame switches itself
  // to the Graph tab when results arrive, undoing an early JSON tab click.
  await expect(waitForActiveTab(page)).resolves.toBe('Graph')

  // Use a DOM click — coordinate-based clicks on the frame tabs are
  // unreliable under automation.
  await page.$eval('.panel.second a#frame-tabs-tab-json', (el) => el.click())
  await waitForElement(page, '.frame-code-tab pre')

  await expect(
    page.$eval('.frame-code-tab pre', (el) => el.textContent),
  ).resolves.toContain('1193880128115965952')
})

/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import {
  clickElement,
  createTestTab,
  fillField,
  setupBrowser,
  typeAndRun,
  waitForActiveTab,
  waitForEditor,
  waitForElement,
  waitForElementDisappear,
} from './puppetHelpers'

import { ensureLoggedIn } from './acl/aclHelpers'

let browser = null
let page = null

beforeAll(async () => {
  // Timeouts come from --testTimeout in scripts/test.sh; clamping them here
  // makes an overrun abandon the test and kill the browser mid-wait instead.
  browser = await setupBrowser()
  page = await createTestTab(browser)

  await ensureLoggedIn(page)
})

afterAll(async () => browser && (await browser.close()))

test('Should send query timeout to server', async () => {
  const queries = []

  await page.setRequestInterception(true)
  page.on('request', (netRequest) => {
    if (netRequest.url().indexOf('/query') >= 0) {
      queries.push(netRequest.url())
    }
    netRequest.continue()
  })

  // Use different timeout on every test run
  const timeoutValue = Math.ceil(Math.random() * 1000)

  const extraSettingsTab = '#connection-settings-tabs-tab-extra-settings'
  const timeoutInput = '.modal.server-connection #queryTimeoutInput'

  await page.click(".sidebar-menu a[href='#connection']")

  await waitForElement(page, extraSettingsTab)
  await page.click(extraSettingsTab)
  await waitForElement(page, timeoutInput)

  await fillField(page, timeoutInput, `${timeoutValue}`)

  // The editor is unmounted while this modal is open, so a close that does not
  // register strands the test on waitForEditor ten seconds later, pointing at
  // the editor rather than at the click that failed.
  await clickElement(page, '.modal-dialog button.close')
  await waitForElementDisappear(page, '.modal.server-connection')
  await waitForElementDisappear(page, '.sidebar-content.open')

  // "Forget" any queries not related to this test
  queries.splice(0, queries.length)

  // Send a query
  await waitForEditor(page)
  await page.click('.editor-panel .CodeMirror')

  await typeAndRun(page, '  { q(func: uid(1)) { uid } }  ')
  await waitForActiveTab(page)

  await expect(waitForActiveTab(page)).resolves.toBe('Graph')

  expect(queries[0]).toContain(`timeout=${timeoutValue}s`)
})

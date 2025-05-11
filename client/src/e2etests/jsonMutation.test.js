/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import {
  createTestTab,
  setupBrowser,
  typeAndRun,
  waitForActiveTab,
  waitForEditor,
} from './puppetHelpers'

import { ensureLoggedIn } from './acl/aclHelpers'

let browser = null
let page = null

beforeAll(async () => {
  jest.setTimeout(10000)
  browser = await setupBrowser()
  page = await createTestTab(browser)

  await ensureLoggedIn(page)
})

afterAll(async () => browser && (await browser.close()))

test('Should execute JSON mutations', async () => {
  await page.click('.editor-panel input.editor-type[value=mutate]')
  await page.click('.editor-panel .CodeMirror')

  await typeAndRun(page, `{ "set": [ { "name": "Alice" } ] }`)

  await expect(waitForActiveTab(page)).resolves.toBe('Message')
})

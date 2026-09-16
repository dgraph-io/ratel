/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createTestTab,
  easyUid,
  setupBrowser,
  typeAndRun,
  waitForActiveTab,
  waitForEditor,
  waitForFramePreview,
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

test('Should run a query and show results', async () => {
  const queryUid = `nodes${easyUid()}`

  await typeAndRun(
    page,
    `{
      ${queryUid}(func: type(Node)) {
        uid
        expand(_all_)
    `,
  )

  await expect(waitForFramePreview(page, queryUid)).resolves.toBeTruthy()
  await expect(waitForActiveTab(page)).resolves.toBe('Graph')
})

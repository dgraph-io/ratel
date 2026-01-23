/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import { createTestTab, setupBrowser, waitForElement } from '../puppetHelpers'
import { loginUser, logoutUser } from './aclHelpers'

let browser = null

beforeAll(async () => {
  jest.setTimeout(10000)
  browser = await setupBrowser()
})

afterAll(async () => browser && (await browser.close()))

test('ACL login/logout should work', async () => {
  const page = await createTestTab(browser)

  await expect(loginUser(page, 'groot', 'password')).resolves.toBe(true)

  await logoutUser(page)
})

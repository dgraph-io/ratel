/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import { loginUser } from './acl/aclHelpers'
import {
  clickElement,
  createTestTab,
  fillField,
  findElementWithText,
  setupBrowser,
  waitForElement,
  waitForElementDisappear,
} from './puppetHelpers'

import { ensureLoggedIn } from './acl/aclHelpers'

let browser = null
let page = null

beforeAll(async () => {
  // No jest.setTimeout here: it would override the --testTimeout the runner
  // passes. This suite took 12s on CI against the 10s it used to set, and
  // overshooting is not reported as a slow test: jest abandons it, afterAll
  // closes the browser, and the wait still polling dies against a dead page
  // ("Target closed"), which jest blames on the suite rather than the test —
  // a failed suite with zero failed tests.
  browser = await setupBrowser()
  page = await createTestTab(browser)

  await ensureLoggedIn(page)
})

afterAll(async () => browser && (await browser.close()))

test('Should accept i18n characters in type names', async () => {
  // Click the "Schema" button.
  await page.click('.sidebar-menu a[href="#schema"]')

  // Wait for schema to render.
  const schemaBtnSelector = '.schema .panel.first .schema-toolbar button.btn'

  const typesBtn = await findElementWithText(page, schemaBtnSelector, 'Types')

  await typesBtn.click()

  await clickElement(page, '.schema-toolbar button.btn.btn-primary')

  const typeNameInput = '.modal.show input#typeName.form-control'
  await waitForElement(page, typeNameInput)
  await fillField(page, typeNameInput, 'WeirdТайп')

  await clickElement(page, '.modal.show .modal-footer button.btn.btn-primary')

  // If the modal has disappeared then a type was created without errors.
  await waitForElementDisappear(page, '.modal.show')
  await waitForElementDisappear(page, '.fade.modal-backdrop.show')
})

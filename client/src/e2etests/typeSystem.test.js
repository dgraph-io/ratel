/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import { loginUser } from './acl/aclHelpers'
import {
  clickElement,
  clickHandle,
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
  // Timeouts come from --testTimeout in scripts/test.sh; clamping them here
  // makes an overrun abandon the test and kill the browser mid-wait instead.
  browser = await setupBrowser()
  page = await createTestTab(browser)

  await ensureLoggedIn(page)
})

afterAll(async () => browser && (await browser.close()))

test('Should accept i18n characters in type names', async () => {
  // Click the "Schema" button.
  await clickElement(page, '.sidebar-menu a[href="#schema"]')

  // Wait for schema to render.
  const schemaBtnSelector = '.schema .panel.first .schema-toolbar button.btn'

  const typesBtn = await findElementWithText(page, schemaBtnSelector, 'Types')

  await clickHandle(typesBtn)

  await clickElement(page, '.schema-toolbar button.btn.btn-primary')

  const typeNameInput = '.modal.show input#typeName.form-control'
  await waitForElement(page, typeNameInput)
  await fillField(page, typeNameInput, 'WeirdТайп')

  await clickElement(page, '.modal.show .modal-footer button.btn.btn-primary')

  // If the modal has disappeared then a type was created without errors.
  await waitForElementDisappear(page, '.modal.show')
  await waitForElementDisappear(page, '.fade.modal-backdrop.show')
})

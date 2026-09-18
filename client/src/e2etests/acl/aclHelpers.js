/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import {
  clickElement,
  clickHandle,
  fillField,
  getElementText,
  waitForEditor,
  waitForElement,
  waitForElementDisappear,
} from '../puppetHelpers'

const SERVER_URL_INPUT = '.modal.server-connection #serverUrlInput'

export const loginUser = async (
  page,
  userid = 'groot',
  password = 'password',
) => {
  if (!(await page.$(SERVER_URL_INPUT))) {
    // Click the connection button if it's not active.
    await clickElement(page, '.sidebar-menu a[href="#connection"]')
  }

  await waitForElement(page, SERVER_URL_INPUT)

  // fillField replaces the whole value, so the 40 Backspace/Delete presses
  // this used to send per field — to clear content that may not be there — are
  // not needed, and neither field can end up holding a half-typed value.
  await fillField(page, '#useridInput', userid)
  await fillField(page, '#passwordInput', password)

  const buttons = await page.$$(
    '.modal.server-connection .modal-body button.btn.btn-primary',
  )
  const btnTexts = await page.$$eval(
    '.modal.server-connection .modal-body button.btn.btn-primary',
    (btns) => btns.map((b) => b.textContent),
  )

  expect(btnTexts).toContain('Login')
  await clickHandle(buttons[btnTexts.indexOf('Login')])

  const spinnerSelector =
    '.modal.server-connection .modal-body button.btn-primary .fa-spinner.fa-pulse'

  // Wait for the loading spinner to show up and then disappear.
  await waitForElement(page, spinnerSelector)
  await waitForElementDisappear(page, spinnerSelector)

  const sidebarText = await getElementText(
    page,
    '.modal.server-connection .modal-body',
  )
  return sidebarText.includes(`Logged in as ${userid}`)
}

export const logoutUser = async (page) => {
  if (!(await page.$(SERVER_URL_INPUT))) {
    // Click the connection button if it's not active.
    await clickElement(page, '.sidebar-menu a[href="#connection"]')
  }

  // Wait for connection settings to show up.
  await waitForElement(page, SERVER_URL_INPUT)

  const btnLogoutSelector = '.modal.server-connection button.btn.btn-secondary'
  const buttons = await page.$$(btnLogoutSelector)
  const btnTexts = await page.$$eval(btnLogoutSelector, (btns) =>
    btns.map((b) => b.textContent),
  )

  if (btnTexts.indexOf('Logout') >= 0) {
    await clickHandle(buttons[btnTexts.indexOf('Logout')])
  }
  await waitForElement(page, '#useridInput')
}

export const ensureLoggedIn = async (page) => {
  await logoutUser(page)
  await loginUser(page)

  // Open console after login.
  await clickElement(page, ".sidebar-menu a[href='#']")
  await waitForEditor(page)
  await page.click('.editor-panel .CodeMirror')
}

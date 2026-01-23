/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer'

import {
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
    await page.click('.sidebar-menu a[href="#connection"]')
  }

  await waitForElement(page, SERVER_URL_INPUT)

  // Clear input field content, if any.
  const clearTextInput = async () => {
    // TODO: This assumes value is less than 20 chars.
    //       There should be a less hacky way.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Delete')
    }
  }

  await page.click('#useridInput')
  await clearTextInput()
  await page.keyboard.type(userid)

  await page.click('#passwordInput')
  await clearTextInput()
  await page.keyboard.type(password)

  const buttons = await page.$$(
    '.modal.server-connection .modal-body button.btn.btn-primary',
  )
  const btnTexts = await page.$$eval(
    '.modal.server-connection .modal-body button.btn.btn-primary',
    (btns) => btns.map((b) => b.textContent),
  )

  expect(btnTexts).toContain('Login')
  buttons[btnTexts.indexOf('Login')].click()

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
    await page.click('.sidebar-menu a[href="#connection"]')
  }

  // Wait for connection settings to show up.
  await waitForElement(page, SERVER_URL_INPUT)

  const btnLogoutSelector = '.modal.server-connection button.btn.btn-secondary'
  const buttons = await page.$$(btnLogoutSelector)
  const btnTexts = await page.$$eval(btnLogoutSelector, (btns) =>
    btns.map((b) => b.textContent),
  )

  if (btnTexts.indexOf('Logout') >= 0) {
    await buttons[btnTexts.indexOf('Logout')].click()
  }
  await waitForElement(page, '#useridInput')
}

export const ensureLoggedIn = async (page) => {
  await logoutUser(page)
  await loginUser(page)

  // Open console after login.
  await page.click(".sidebar-menu a[href='#']")
  await waitForEditor(page)
  await page.click('.editor-panel .CodeMirror')
}

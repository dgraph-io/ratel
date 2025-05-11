/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'child_process'
import puppeteer from 'puppeteer'

import {
  createTestTab,
  easyUid,
  getElementText,
  setupBrowser,
  waitForElement,
  waitForElementDisappear,
  waitUntil,
} from '../puppetHelpers'

import { loginUser, logoutUser } from './aclHelpers'

let browser = null

beforeAll(async () => {
  browser = await setupBrowser()
})

afterAll(async () => browser && (await browser.close()))

const generateTestUser = async (page) => {
  const addBtnSelector = '.acl-view .panel.first button.btn.btn-primary'
  await expect(
    page.$eval(addBtnSelector, (btn) => btn.textContent),
  ).resolves.toBe('Add User')

  const userId = `addedUser-${easyUid()}`
  const password = 'AddedUserPassword'

  await page.click(addBtnSelector)

  await waitForElement(page, '.modal.show .form-group #userId')

  await page.click('.modal.show .form-group #userId')
  await page.keyboard.type(userId)

  await page.click('.modal.show .form-group #password')
  await page.keyboard.type(password)

  await page.click('.modal.show .form-group #passwordRepeat')
  await page.keyboard.type(password)

  await page.click('.modal.show .modal-footer button.btn.btn-primary')

  await waitForElementDisappear(page, '.modal.show .form-group #userId')

  return userId
}

test('New user and new group should be visible in the CLI tools', async () => {
  const page = await createTestTab(browser)

  await logoutUser(page)
  await expect(loginUser(page, 'groot', 'password')).resolves.toBe(true)

  await page.click('.sidebar-menu a[href="#acl"]')

  // Groot should always exist.
  await waitForElement(page, '.main-content.acl .datagrid div[title=groot]')

  const userId = await generateTestUser(page)

  const userInfoPromise = new Promise((resolve, reject) => {
    const infoUser = spawn(process.env.JEST_DGRAPH_CMD || 'dgraph', [
      'acl',
      'info',
      '--gpassword',
      'password',
      '-u',
      userId,
    ])

    let stdout = ''
    let stderr = ''

    infoUser.stdout.on('data', (data) => {
      stdout += data
      if (data.indexOf(`User  : ${userId}`) >= 0) {
        resolve(true)
      }
    })
    infoUser.stderr.on('data', (data) => (stderr += data))

    infoUser.on('close', (code) =>
      reject(`CLI exited. Code ${code}\nO> ${stdout}\nE> ${stderr}`),
    )
  })

  await expect(userInfoPromise).resolves.toBeTruthy()
})

/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from "puppeteer"

import { createTestTab, setupBrowser, waitForElement } from "../puppetHelpers"

import { ensureLoggedIn, loginUser, logoutUser } from "./aclHelpers"

let browser = null
let page = null

beforeAll(async () => {
    jest.setTimeout(10000)
    browser = await setupBrowser()
})

afterAll(async () => browser && (await browser.close()))

test("ACL login should work if the password is correct", async () => {
    page = await createTestTab(browser)
    await expect(loginUser(page, "bob", "R 4 N D O M")).resolves.toBe(false)
    await expect(loginUser(page, "groot", "password")).resolves.toBe(true)
})

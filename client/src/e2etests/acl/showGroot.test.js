/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from "puppeteer";

import { createTestTab, setupBrowser, waitForElement } from "../puppetHelpers";

import { loginUser, logoutUser } from "./aclHelpers";

let browser = null;

beforeAll(async () => {
    jest.setTimeout(10000);
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("ACL should show users when logged in as groot", async () => {
    const page = await createTestTab(browser);

    await logoutUser(page);
    await expect(loginUser(page, "groot", "password")).resolves.toBe(true);

    // First click will close the modal.
    await page.click('.sidebar-menu a[href="#acl"]');
    await page.click('.sidebar-menu a[href="#acl"]');

    // Groot should always exist.
    await waitForElement(page, ".main-content.acl .datagrid div[title=groot]");
});

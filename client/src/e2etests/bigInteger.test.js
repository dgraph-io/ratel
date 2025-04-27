/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from "puppeteer";

import {
    easyUid,
    createHttpClient,
    createTestTab,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
    waitForElement,
    waitForFramePreview,
} from "./puppetHelpers";

import { ensureLoggedIn } from "./acl/aclHelpers";

let browser = null;
let page = null;

beforeAll(async () => {
    jest.setTimeout(10000);
    jest.retryTimes(5);

    browser = await setupBrowser();
    page = await createTestTab(browser);

    await ensureLoggedIn(page);
});

afterAll(async () => browser && (await browser.close()));

test("Should draw one to one nodes", async () => {
    const testId = `testRun${easyUid()}`;

    const httpClient = await createHttpClient();
    await httpClient.alter({ schema: `${testId}_money: int .` });
    await httpClient.newTxn().mutate({
        setJson: {
            [testId + "_money"]: "1193880128115965952",
        },
        commitNow: true,
    });

    await typeAndRun(
        page,
        `{
            query(func: has(${testId}_money)) {
              uid
              ${testId}_money
    `,
    );

    await expect(
        waitForFramePreview(page, `${testId}_money`),
    ).resolves.toBeTruthy();

    await page.click(".panel.second a#frame-tabs-tab-json");
    await waitForElement(page, ".frame-code-tab pre");

    await expect(
        page.$eval(".frame-code-tab pre", el => el.textContent),
    ).resolves.toContain("1193880128115965952");
});

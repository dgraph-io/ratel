/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from "puppeteer";

import {
    createTestTab,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
    waitForElement,
} from "./puppetHelpers";

import { ensureLoggedIn } from "./acl/aclHelpers";

let browser = null;
let page = null;

beforeAll(async () => {
    jest.setTimeout(15000);
    browser = await setupBrowser();
    page = await createTestTab(browser);

    await ensureLoggedIn(page);
});

afterAll(async () => browser && (await browser.close()));

// skipping the below test since it's needs deeper investigation
test.skip("Should execute mutations only once", async () => {
    const mutations = [];

    await page.setRequestInterception(true);
    page.on("request", netRequest => {
        if (netRequest.url().indexOf("/mutate") >= 0) {
            mutations.push(netRequest.url());
        }
        netRequest.continue();
    });

    await waitForEditor(page);

    await page.click(".editor-panel input.editor-type[value=mutate]");
    await page.click(".editor-panel .CodeMirror");

    expect(mutations).toHaveLength(0);

    // Submit a mutation
    await typeAndRun(page, `{ "set": [ { "name": "Alice" } ] }`);
    await expect(waitForActiveTab(page)).resolves.toBe("Message");

    expect(mutations).toHaveLength(1);

    // Do some clicking around
    await page.click(".sidebar-menu a[href='#schema']");
    await waitForElement(page, ".btn-toolbar.schema-toolbar");

    await page.click(".sidebar-menu a[href='#info']");
    await waitForElement(page, ".sidebar-content.open .sidebar-help");

    // Go back to console
    await page.click(".sidebar-menu a[href='#']");
    await expect(waitForActiveTab(page)).resolves.toBe("Message");

    expect(mutations).toHaveLength(
        1,
        "Ratel shouldn't send duplicate mutations",
    );
});

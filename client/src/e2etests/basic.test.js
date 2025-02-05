/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    createTestTab,
    easyUid,
    setupBrowser,
    typeAndRun,
    waitForActiveTab,
    waitForEditor,
    waitForFramePreview,
} from "./puppetHelpers";

import { ensureLoggedIn } from "./acl/aclHelpers";

let browser = null;
let page = null;

beforeAll(async () => {
    jest.setTimeout(10000);
    browser = await setupBrowser();
    page = await createTestTab(browser);

    await ensureLoggedIn(page);
});

afterAll(async () => browser && (await browser.close()));

test("Should run a query and show results", async () => {
    const queryUid = `nodes${easyUid()}`;

    await typeAndRun(
        page,
        `{
      ${queryUid}(func: type(Node)) {
        uid
        expand(_all_)
    `,
    );

    await expect(waitForFramePreview(page, queryUid)).resolves.toBeTruthy();
    await expect(waitForActiveTab(page)).resolves.toBe("Graph");
});

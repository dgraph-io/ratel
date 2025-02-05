/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from "puppeteer";

import {
    createHttpClient,
    createTestTab,
    easyUid,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForElement,
    waitForElementDisappear,
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

// Test for https://github.com/dgraph-io/ratel/issues/93
test("Clicking <Show remaining X nodes> must update the graph", async () => {
    // Insert test nodes.
    const N = 678;
    const testId = `testRun${easyUid()}`;
    const nodes = [];
    for (let i = 0; i < N; i++) {
        nodes.push(`<_:node${i}> <${testId}> "node ${i}" .`);
    }
    const httpClient = await createHttpClient();
    const mutationRes = httpClient.newTxn().mutate({
        commitNow: true,
        mutation: `
        { set {
            ${nodes.join("\n")}
        } }`,
    });

    // Make sure mutation was successful
    await expect(mutationRes).resolves.toHaveProperty("data.code", "Success");

    await typeAndRun(
        page,
        `{
            query(func: has(${testId})) {
              uid
              ${testId}
    `,
    );

    const expandBtnSelector = ".partial-render-info button.btn-link";
    await expect(waitForElement(page, expandBtnSelector)).resolves.toBeTruthy();

    await expect(
        page.$eval(expandBtnSelector, el => el.textContent),
    ).resolves.toBe(`Expand remaining ${N - 400} nodes.`);

    // Click the "Expand remaining" button.
    await page.click(expandBtnSelector);

    // After clicking "Expand remaining" it should expand graph and disappear.
    await expect(
        waitForElementDisappear(page, expandBtnSelector),
    ).resolves.toBe(true);
});

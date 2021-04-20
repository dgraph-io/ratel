// Copyright 2020 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
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

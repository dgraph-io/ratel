// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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
} from "./puppetHelpers";

import { ensureLoggedIn } from "./acl/aclHelpers";

let browser = null;
let page = null;

beforeAll(async () => {
    browser = await setupBrowser();
    page = await createTestTab(browser);

    await ensureLoggedIn(page);
});

afterAll(async () => browser && (await browser.close()));

test("Should draw one to one nodes", async () => {
    jest.retryTimes(5);
    const testId = `testRun${easyUid()}`;

    const httpClient = await createHttpClient();
    await httpClient.alter({ schema: `${testId}: uid .` });
    await httpClient.newTxn().mutate({
        setJson: {
            [testId + "_name"]: "Alice",
            [testId]: {
                [testId + "_name"]: "Bob",
            },
        },
        commitNow: true,
    });

    await typeAndRun(
        page,
        `{
            query(func: has(${testId})) {
              uid
              ${testId} { uid }
    `,
    );

    const summarySelector = ".graph-overlay .title";
    await waitForElement(page, summarySelector);

    await expect(
        page.$eval(summarySelector, el => el.textContent),
    ).resolves.toBe("Showing 2 nodes and 1 edges");
});

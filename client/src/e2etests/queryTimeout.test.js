// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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
    createTestTab,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
    waitForElement,
    waitForElementDisappear,
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

test("Should send query timeout to server", async () => {
    const queries = [];

    await page.setRequestInterception(true);
    page.on("request", netRequest => {
        if (netRequest.url().indexOf("/query") >= 0) {
            queries.push(netRequest.url());
        }
        netRequest.continue();
    });

    // Use different timeout on every test run
    const timeoutValue = Math.ceil(Math.random() * 1000);

    const extraSettingsTab = "#connection-settings-tabs-tab-extra-settings";
    const timeoutInput = ".modal.server-connection #queryTimeoutInput";

    await page.click(".sidebar-menu a[href='#connection']");

    await waitForElement(page, extraSettingsTab);
    await page.click(extraSettingsTab);
    await waitForElement(page, timeoutInput);

    await page.click(timeoutInput);
    await page.evaluate(() => document.execCommand("selectall", false, null));
    await page.type(timeoutInput, `${timeoutValue}`);

    await page.click(".modal-dialog button.close");
    await waitForElementDisappear(page, ".sidebar-content.open");

    // "Forget" any queries not related to this test
    queries.splice(0, queries.length);

    // Send a query
    await waitForEditor(page);
    await page.click(".editor-panel .CodeMirror");

    await typeAndRun(page, "  { q(func: uid(1)) { uid } }  ");
    await waitForActiveTab(page);

    await expect(waitForActiveTab(page)).resolves.toBe("Graph");

    expect(queries[0]).toContain(`timeout=${timeoutValue}s`);
});

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
    waitForElement,
    waitUntil,
} from "../puppetHelpers";
import { ensureLoggedIn, loginUser, logoutUser } from "./aclHelpers";

let browser = null;
let page = null;

beforeAll(async () => {
    browser = await setupBrowser();
    page = await createTestTab(browser);

    await ensureLoggedIn(page);
});

afterAll(async () => browser && (await browser.close()));

test("ACL should show an error if user isn't logged in", async () => {
    await logoutUser(page);

    // Close the connection modal and open ACL page.
    await page.click('.sidebar-menu a[href="#acl"]');
    await page.click('.sidebar-menu a[href="#acl"]');

    // Error message should appear on screen.
    await expect(
        waitUntil(async () => {
            const text = await page.$eval(
                `.main-content.acl .acl-view`,
                el => el.textContent,
            );
            return text.includes("You need to login as a guardians");
        }),
    ).resolves.toBeTruthy();
});

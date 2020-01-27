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
    createTestTab,
    getElementText,
    setupBrowser,
    waitForElement,
    waitUntil,
} from "../puppetHelpers";

import { loginUser, logoutUser } from "./aclHelpers";

let browser = null;

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("Should persist group's permissions", async () => {
    const page = await createTestTab(browser);

    await logoutUser(page);
    await expect(loginUser(page, "groot", "password")).resolves.toBe(true);

    await page.click('.sidebar-menu a[href="#acl"]');

    // Groot should always exist.
    await waitForElement(page, ".main-content.acl .datagrid div[title=groot]");

    const btnGroups =
        ".acl-view .panel.first .btn-toolbar button.btn-sm:nth-child(3)";
    await expect(getElementText(page, btnGroups)).resolves.toContain("Groups");
    await page.click(btnGroups);
});

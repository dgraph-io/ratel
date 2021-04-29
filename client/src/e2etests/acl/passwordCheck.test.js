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

import { createTestTab, setupBrowser, waitForElement } from "../puppetHelpers";

import { ensureLoggedIn, loginUser, logoutUser } from "./aclHelpers";

let browser = null;
let page = null;

beforeAll(async () => {
    jest.setTimeout(10000);
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("ACL login should work if the password is correct", async () => {
    page = await createTestTab(browser);
    await expect(loginUser(page, "bob", "R 4 N D O M")).resolves.toBe(false);
    await expect(loginUser(page, "groot", "password")).resolves.toBe(true);
});

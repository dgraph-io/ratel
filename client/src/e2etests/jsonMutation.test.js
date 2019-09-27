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
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("Should execute JSON mutations", async () => {
    const page = await createTestTab(browser);

    await waitForEditor(page);

    await page.click(".editor-panel input.editor-type[value=mutate]");
    await page.click(".editor-panel .CodeMirror");

    await typeAndRun(page, `{ "set": [ { "name": "Alice" } ] }`);

    await expect(waitForActiveTab(page)).resolves.toBe("Response");
});

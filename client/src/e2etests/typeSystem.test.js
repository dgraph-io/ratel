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

import { loginUser } from "./acl/aclHelpers";
import {
    createTestTab,
    findElementWithText,
    setupBrowser,
    waitForElement,
    waitForElementDisappear,
} from "./puppetHelpers";

let browser = null;

jest.setTimeout(20000);

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("Should accept i18n characters in type names", async () => {
    const page = await createTestTab(browser);

    await loginUser(page);

    // Click the "Schema" button.
    await page.click('.sidebar-menu a[href="#schema"]');

    // Wait for schema to render.
    const schemaBtnSelector = ".schema .panel.first .schema-toolbar button.btn";

    const typesBtn = await findElementWithText(
        page,
        schemaBtnSelector,
        "Types",
    );

    await typesBtn.click();

    await page.click(".schema-toolbar button.btn.btn-primary");

    const typeNameInput = ".modal.show input#typeName.form-control";
    await waitForElement(page, typeNameInput);
    await page.click(typeNameInput);
    await page.keyboard.type("WeirdТайп");

    await page.click(".modal.show .modal-footer button.btn.btn-primary");

    // If the modal has disappeared then a type was created without errors.
    await waitForElementDisappear(page, ".modal.show");
    await waitForElementDisappear(page, ".fade.modal-backdrop.show");
});

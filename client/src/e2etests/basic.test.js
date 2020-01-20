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

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
import { spawn } from "child_process";
import puppeteer from "puppeteer";

import {
    createTestTab,
    easyUid,
    getElementText,
    setupBrowser,
    waitForElement,
    waitForElementDisappear,
} from "../puppetHelpers";

import { loginUser, logoutUser } from "./aclHelpers";

let browser = null;

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

const generateTestUser = async page => {
    const addBtnSelector = ".acl-view .panel.first button.btn.btn-primary";
    await expect(
        page.$eval(addBtnSelector, btn => btn.textContent),
    ).resolves.toBe("Add User");

    const userId = `addedUser-${easyUid()}`;
    const password = "AddedUserPassword";

    await page.click(addBtnSelector);

    await waitForElement(page, ".modal.show .form-group #userId");

    await page.click(".modal.show .form-group #userId");
    await page.keyboard.type(userId);

    await page.click(".modal.show .form-group #password");
    await page.keyboard.type(password);

    await page.click(".modal.show .form-group #passwordRepeat");
    await page.keyboard.type(password);

    await page.click(".modal.show .modal-footer button.btn.btn-primary");

    await waitForElementDisappear(page, ".modal.show .form-group #userId");

    return userId;
};

test("New user and new group should be visible in the CLI tools", async () => {
    const page = await createTestTab(browser);

    await logoutUser(page);
    await expect(loginUser(page, "groot", "password")).resolves.toBe(true);

    await page.click('.sidebar-menu a[href="#acl"]');

    // Groot should always exist.
    await waitForElement(page, ".main-content.acl .datagrid div[title=groot]");

    const userId = await generateTestUser(page);

    const userInfoPromise = new Promise((resolve, reject) => {
        const infoUser = spawn(process.env.JEST_DGRAPH_CMD || "dgraph", [
            "acl",
            "info",
            "--guardian_password",
            "password",
            "-u",
            userId,
        ]);

        let stdout = "";
        let stderr = "";

        infoUser.stdout.on("data", data => {
            stdout += data;
            if (data.indexOf(`User  : ${userId}`) >= 0) {
                resolve(true);
            }
        });
        infoUser.stderr.on("data", data => (stderr += data));

        infoUser.on("close", code =>
            reject(`CLI exited. Code ${code}\nO> ${stdout}\nE> ${stderr}`),
        );
    });

    await expect(userInfoPromise).resolves.toBeTruthy();
});

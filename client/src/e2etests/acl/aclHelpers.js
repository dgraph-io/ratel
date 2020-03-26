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
    getElementText,
    waitForEditor,
    waitForElement,
    waitForElementDisappear,
} from "../puppetHelpers";

export const loginUser = async (
    page,
    userid = "groot",
    password = "password",
) => {
    if (!(await page.$(".sidebar-content.open #serverUrlInput"))) {
        // Click the connection button if it's not active.
        await page.click('.sidebar-menu a[href="#connection"]');
    }

    await waitForElement(page, "#serverUrlInput");

    // Clear input field content, if any.
    const clearTextInput = async () => {
        // TODO: This assumes value is less than 20 chars.
        //       There should be a less hacky way.
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press("Backspace");
            await page.keyboard.press("Delete");
        }
    };

    await page.click("#useridInput");
    await clearTextInput();
    await page.keyboard.type(userid);

    await page.click("#passwordInput");
    await clearTextInput();
    await page.keyboard.type(password);

    const buttons = await page.$$(
        ".sidebar-content.open button.btn.btn-primary",
    );
    const btnTexts = await page.$$eval(
        ".sidebar-content.open button.btn.btn-primary",
        btns => btns.map(b => b.textContent),
    );

    expect(btnTexts).toContain("Login");
    buttons[btnTexts.indexOf("Login")].click();

    const spinnerSelector =
        ".sidebar-content.open button.btn-primary .fa-spinner.fa-pulse";

    // Wait for the loading spinner to show up and then disappear.
    await waitForElement(page, spinnerSelector);
    await waitForElementDisappear(page, spinnerSelector);

    const sidebarText = await getElementText(page, `.sidebar-content.open`);
    return sidebarText.includes(`Logged in as ${userid}`);
};

export const logoutUser = async page => {
    if (!(await page.$(".sidebar-content.open #serverUrlInput"))) {
        // Click the connection button if it's not active.
        await page.click('.sidebar-menu a[href="#connection"]');
    }

    // Wait for connection settings to show up.
    await waitForElement(page, ".sidebar-content.open #serverUrlInput");

    const btnLogoutSelector = ".sidebar-content.open button.btn.btn-danger";
    const buttons = await page.$$(btnLogoutSelector);
    const btnTexts = await page.$$eval(btnLogoutSelector, btns =>
        btns.map(b => b.textContent),
    );

    if (btnTexts.indexOf("Logout") >= 0) {
        await buttons[btnTexts.indexOf("Logout")].click();
    }
    await waitForElement(page, "#useridInput");
};

export const ensureLoggedIn = async page => {
    await logoutUser(page);
    await loginUser(page);

    // Open console after login.
    await page.click(".sidebar-menu a[href='#']");
    await waitForEditor(page);
    await page.click(".editor-panel .CodeMirror");
};

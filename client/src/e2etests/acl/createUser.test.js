import puppeteer from "puppeteer";

import {
    createTestTab,
    setupBrowser,
    waitForElement,
    waitForElementDisappear,
    waitUntil,
} from "../puppetHelpers";
import { loginUser, logoutUser } from "./aclHelpers";

let browser = null;

jest.setTimeout(20000);

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("Should be able to create and delete a user", async () => {
    const page = await createTestTab(browser);

    await logoutUser(page);
    await loginUser(page);

    // Click the "ACL" button.
    await page.click('.sidebar-menu a[href="#acl"]');

    await waitForElement(page, ".main-content.acl .datagrid div[title=groot]");

    const addBtnSelector = ".acl-view .panel.first button.btn.btn-primary";
    await expect(
        page.$eval(addBtnSelector, btn => btn.textContent),
    ).resolves.toBe("Add User");

    const userId = "addedUser";
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

    // New user should show up in the table.
    await waitForElement(
        page,
        ".main-content.acl .datagrid div[title=addedUser]",
    );

    // Should be able to login as a new user
    await logoutUser(page);
    await expect(loginUser(page, userId, password)).resolves.toBe(true);

    // logout and login as groot
    await logoutUser(page);
    await expect(loginUser(page)).resolves.toBe(true);

    await page.click('.sidebar-menu a[href="#acl"]');

    await waitForElement(
        page,
        `.main-content.acl .datagrid div[title=${userId}]`,
    );

    await page.click(".main-content.acl .datagrid div[title=addedUser]");

    const deleteUserSelector = ".acl-view .panel.second button.btn.btn-danger";
    await expect(
        page.$eval(deleteUserSelector, btn => btn.textContent),
    ).resolves.toBe("Delete User");

    const dialogPromise = new Promise((resolve, reject) => {
        page.on("dialog", dialog => {
            try {
                resolve(dialog.message());
                dialog.accept();
            } catch (err) {
                reject(err);
            }
        });
    });

    await page.click(deleteUserSelector);

    await expect(dialogPromise).resolves.toBe(
        `Are you sure you want to delete "${userId}"?`,
    );

    await expect(
        waitForElementDisappear(
            page,
            `.main-content.acl .datagrid div[title=${userId}]`,
        ),
    ).resolves.toBe(true);
});

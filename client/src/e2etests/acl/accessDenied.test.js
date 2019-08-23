import puppeteer from "puppeteer";

import {
    createTestTab,
    setupBrowser,
    waitForElement,
    waitUntil,
} from "../puppetHelpers";
import { loginUser, logoutUser } from "./aclHelpers";

let browser = null;

jest.setTimeout(20000);

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("ACL should show an error if user isn't logged in", async () => {
    const page = await createTestTab(browser);

    await logoutUser(page);

    // Click the "ACL" button.
    await page.click('.sidebar-menu a[href="#acl"]');

    // Error message should appear on screen.
    await expect(
        waitUntil(async () => {
            const text = await page.$eval(
                `.main-content.acl .acl-view`,
                el => el.textContent,
            );
            return text.includes("only groot is allowed to access the ACL");
        }),
    ).resolves.toBeTruthy();
});

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

test("ACL login should work iff the password is correct", async () => {
    const page = await createTestTab(browser);

    await logoutUser(page);
    await expect(loginUser(page, "bob", "R 4 N D O M")).resolves.toBe(false);
    await expect(loginUser(page, "groot", "password")).resolves.toBe(true);
});

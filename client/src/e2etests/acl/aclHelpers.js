import puppeteer from "puppeteer";

import { getElementText, waitForElement, waitUntil } from "../puppetHelpers";

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

    await waitUntil(async () => {
        try {
            return !(await page.$(spinnerSelector));
        } catch (err) {
            return false;
        }
    });

    const sidebarText = await getElementText(page, `.sidebar-content.open`);
    return sidebarText.includes(`Logged in as "${userid}"`);
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

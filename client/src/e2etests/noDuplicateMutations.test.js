import puppeteer from "puppeteer";

import {
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
    waitForElement,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await puppeteer.launch();
});

afterAll(async () => browser && (await browser.close()));

test("Should execute mutations only once", async () => {
    const page = await browser.newPage();
    await page.goto("http://localhost:3000");

    const mutations = [];

    await page.setRequestInterception(true);
    page.on("request", netRequest => {
        if (netRequest.url().indexOf("/mutate") >= 0) {
            mutations.push(netRequest.url());
        }
        netRequest.continue();
    });

    await waitForEditor(page);

    await page.click(".editor-panel input.editor-type[value=mutate]");
    await page.click(".editor-panel .CodeMirror");

    expect(mutations).toHaveLength(0);

    // Submit a mutation
    await typeAndRun(page, `{ "set": [ { "name": "Alice" } ] }`);
    await expect(waitForActiveTab(page)).resolves.toBe("Response");

    expect(mutations).toHaveLength(1);

    // Do some clicking around
    await page.click(".sidebar-menu a[href='#schema']");
    await waitForElement(page, ".btn-toolbar.schema-toolbar");

    await page.click(".sidebar-menu a[href='#info']");
    await waitForElement(page, ".sidebar-content.open .sidebar-help");

    // Go back to console
    await page.click(".sidebar-menu a[href='#']");
    await expect(waitForActiveTab(page)).resolves.toBe("Response");

    expect(mutations).toHaveLength(
        1,
        "Ratel shouldn't send duplicate mutations",
    );
});

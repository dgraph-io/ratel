import puppeteer from "puppeteer";

import {
    createTestTab,
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await puppeteer.launch();
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

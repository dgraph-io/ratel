import puppeteer from "puppeteer";

import {
    easyUid,
    setupBrowser,
    typeAndRun,
    waitForActiveTab,
    waitForEditor,
    waitForFramePreview,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await puppeteer.launch();
    console.log("Browser: ", browser);
});

afterAll(async () => await browser.close());

test("Should run a query and show results", async () => {
    const page = await browser.newPage();
    await page.goto("http://localhost:3000");

    await waitForEditor(page);

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

import puppeteer from "puppeteer";

import {
    createTestTab,
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
});

afterAll(async () => browser && (await browser.close()));

test("Should run a query and show results", async () => {
    const page = await createTestTab(browser);
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

import puppeteer from "puppeteer";

import {
    easyUid,
    createHttpClient,
    createTestTab,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForActiveTab,
    waitForElement,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("Should draw one to one nodes", async () => {
    const page = await createTestTab(browser);

    await waitForEditor(page);

    const testId = `testRun${easyUid()}`;

    await createHttpClient().alter({ schema: `${testId}: uid .` });
    await createHttpClient()
        .newTxn()
        .mutate({
            setJson: {
                [testId + "_name"]: "Alice",
                [testId]: {
                    [testId + "_name"]: "Bob",
                },
            },
            commitNow: true,
        });

    await typeAndRun(
        page,
        `{
            query(func: has(${testId})) {
              uid
              ${testId} { uid }
    `,
    );

    const summarySelector = ".graph-overlay .title";
    await waitForElement(page, summarySelector);

    await expect(
        page.$eval(summarySelector, el => el.textContent),
    ).resolves.toBe("Showing 2 nodes and 1 edges");
});

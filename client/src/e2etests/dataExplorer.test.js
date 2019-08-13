import puppeteer from "puppeteer";

import {
    createHttpClient,
    createTestTab,
    easyUid,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForElement,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

test("DataExplorer should display something", async () => {
    // Insert test nodes.
    const testId = `dataExplorer_test_${easyUid()}`;
    const mutationRes = createHttpClient()
        .newTxn()
        .mutate({
            commitNow: true,
            mutation: `
        { set {
            <_:node> <ALPHA_${testId}> "${Date.now()}" .
            <_:node> <BRAVO_${testId}> "${Date.now()}" .
        } }`,
        });

    const page = await createTestTab(browser);
    await waitForEditor(page);

    // Make sure mutation was successful
    await expect(mutationRes).resolves.toHaveProperty("data.code", "Success");

    // Click the "Data Explorer" button.
    await page.click('.sidebar-menu a[href="#dataexplorer"]');

    // After clicking "Data Explorer" the test predicates should show up in DE.
    await expect(
        waitForElement(
            page,
            `.main-content.dataexplorer div[title=ALPHA_${testId}]`,
        ),
    ).resolves.toBeTruthy();

    await expect(
        waitForElement(
            page,
            `.main-content.dataexplorer div[title=BRAVO_${testId}]`,
        ),
    ).resolves.toBeTruthy();
});

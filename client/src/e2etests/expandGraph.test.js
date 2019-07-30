import puppeteer from "puppeteer";

import {
    createHttpClient,
    createTestTab,
    easyUid,
    setupBrowser,
    typeAndRun,
    waitForEditor,
    waitForElement,
    waitUntil,
} from "./puppetHelpers";

let browser = null;

beforeAll(async () => {
    browser = await setupBrowser();
});

afterAll(async () => browser && (await browser.close()));

// Test for https://github.com/dgraph-io/ratel/issues/93
test("Clicking <Show remaining X nodes> must update the graph", async () => {
    // Insert test nodes.
    const N = 678;
    const testId = `testRun${easyUid()}`;
    const nodes = [];
    for (let i = 0; i < N; i++) {
        nodes.push(`<_:node${i}> <${testId}> "node ${i}" .`);
    }
    const mutationRes = createHttpClient()
        .newTxn()
        .mutate({
            commitNow: true,
            mutation: `
        { set {
            ${nodes.join("\n")}
        } }`,
        });

    const page = await createTestTab(browser);
    await waitForEditor(page);

    // Make sure mutation was successful
    await expect(mutationRes).resolves.toHaveProperty("data.code", "Success");

    await typeAndRun(
        page,
        `{
            query(func: has(${testId})) {
              uid
              ${testId}
    `,
    );

    const expandBtnSelector = ".partial-render-info button.btn-link";
    await expect(waitForElement(page, expandBtnSelector)).resolves.toBeTruthy();

    await expect(
        page.$eval(expandBtnSelector, el => el.textContent),
    ).resolves.toBe(`Expand remaining ${N - 400} nodes.`);

    // Click the "Expand remaining" button.
    await page.click(expandBtnSelector);

    // After clicking "Expand remaining" it should expand graph and disappear.
    await expect(
        waitUntil(async () => !(await page.$(expandBtnSelector))),
    ).resolves.toBe(true);
});

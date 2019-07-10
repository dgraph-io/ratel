import puppeteer from "puppeteer";

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

const waitUntil = async (fn, timeout = 5000, step = 10) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const ret = await fn();
        if (ret) {
            return ret;
        }
        await sleep(step);
    }
    throw new Error(`Timeout ${timeout}ms exceeded`);
};

const waitForElement = async (page, query) => waitUntil(() => page.$(query));

const waitForEditor = async page =>
    waitForElement(page, ".editor-panel .CodeMirror-cursors");

const typeAndRun = async (page, query) => {
    await page.keyboard.type(query, { delay: 5 });

    await page.keyboard.down("Control");
    await page.keyboard.press("Enter", { delay: 10 });
    await page.keyboard.up("Control");
};

test("Should execute JSON mutations without errors", async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("http://localhost:3000");

    await waitForEditor(page);

    await page.click(".editor-panel input.editor-type[value=mutate]");
    await page.click(".editor-panel .CodeMirror");

    await typeAndRun(page, `{ "set": [ { "name": "Alice" } ] }`);

    const activeTabSelector = ".frame-item .toolbar.nav.nav-tabs a.active";
    await waitForElement(page, activeTabSelector);
    const activeTab = await page.$eval(activeTabSelector, el => el.textContent);
    expect(activeTab).toBe("Response");

    await browser.close();
});

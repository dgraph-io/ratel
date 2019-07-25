import * as dgraph from "dgraph-js-http";

export const sleep = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

export const waitUntil = async (fn, timeout = 2000, step = 10) => {
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

export const waitForElement = async (page, query) =>
    waitUntil(() => page.$(query));

export const waitForEditor = async page =>
    waitForElement(page, ".editor-panel .CodeMirror-cursors");

export const createTestTab = async browser => {
    const page = await browser.newPage();
    await page.goto(process.env.RATEL_TEST_URL || "http://localhost:3000");

    return page;
};

export const createHttpClient = async => {
    const serverUrl = process.env.RATEL_TEST_SERVER || "http://localhost:8080";
    return new dgraph.DgraphClient(new dgraph.DgraphClientStub(serverUrl));
};

export const typeAndRun = async (page, query) => {
    await page.keyboard.type(query);

    await page.keyboard.down("Control");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Control");
};

export const easyUid = () =>
    `${Date.now() % 9973}_${Math.round(Math.random() * 9967)}`;

export const waitForFramePreview = async (page, keyword) =>
    waitUntil(async () => {
        const previewSelector = ".frame-header .preview";
        const framePreview = await waitForElement(page, previewSelector);
        const text = await page.$eval(previewSelector, el => el.textContent);
        return text.includes(keyword);
    });

export const waitForActiveTab = async page =>
    waitUntil(async () => {
        const activeTabSelector = ".frame-item .toolbar.nav.nav-tabs a.active";
        await waitForElement(page, activeTabSelector);
        return await page.$eval(activeTabSelector, el => el.textContent);
    });

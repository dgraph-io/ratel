import * as dgraph from "dgraph-js-http";
import puppeteer from "puppeteer";

const DGRAPH_SERVER = process.env.TEST_DGRAPH_SERVER || "http://localhost:8080";
const RATEL_URL = process.env.TEST_RATEL_URL || "http://localhost:3000";

export async function setupBrowser() {
    if (process.env.JEST_PPTR_DOCKER) {
        return await puppeteer.launch({
            executablePath: "google-chrome-unstable",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }
    // For local development use default puppeteer settings.
    return await puppeteer.launch({
        defaultViewport: { width: 1280, height: 1024 },
    });
}

export const sleep = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

export const waitUntil = async (
    fn,
    { timeout = 2000, step = 10, page } = {},
) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const ret = await fn();
        if (ret) {
            return ret;
        }
        await sleep(step);
    }
    if (page) {
        const path = `screenshot_${new Date().toISOString()}.png`;
        await page.screenshot({ path });
        console.error(
            `Timeout ${timeout}ms exceeded. See screenshot at ${path}`,
        );
    }
    throw new Error(`Timeout ${timeout}ms exceeded`);
};

export const waitForElement = async (page, query, { timeout = 2000 } = {}) => {
    try {
        return await waitUntil(() => page.$(query), timeout);
    } catch (err) {
        const path = `screenshot_${new Date().toISOString()}.png`;
        await page.screenshot({ path });
        console.error(
            `Timeout waiting for element "${query}". See screenshot at ${path}`,
        );
        throw err;
    }
};

export const waitForElementDisappear = async (
    page,
    query,
    { timeout = 2000 } = {},
) => {
    try {
        return await waitUntil(async () => !(await page.$(query)), timeout);
    } catch (err) {
        const path = `screenshot_${new Date().toISOString()}.png`;
        await page.screenshot({ path });
        console.error(
            `Timeout waiting for element to disappear "${query}". See screenshot at ${path}`,
        );
        throw err;
    }
};

export const waitForEditor = async page =>
    waitForElement(page, ".editor-panel .CodeMirror-cursors");

export const createTestTab = async browser => {
    const page = await browser.newPage();
    // naive check to see if RATEL_URL already has query params
    if (RATEL_URL.includes("?")) {
        await page.goto(`${RATEL_URL}&addr=${DGRAPH_SERVER}`);
    } else {
        await page.goto(`${RATEL_URL}?addr=${DGRAPH_SERVER}`);
    }

    return page;
};

export const createHttpClient = async => {
    return new dgraph.DgraphClient(new dgraph.DgraphClientStub(DGRAPH_SERVER));
};

export const typeAndRun = async (page, query) => {
    await page.keyboard.type(query);

    await page.keyboard.down("Control");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Control");
};

export const easyUid = () =>
    `${Date.now() % 9973}_${Math.round(Math.random() * 9967)}`;

export const getElementText = async (page, query) =>
    await page.$eval(query, el => el.textContent);

export const waitForFramePreview = async (page, keyword) =>
    waitUntil(async () => {
        const previewSelector = ".frame-header .preview";
        await waitForElement(page, previewSelector);
        const text = await getElementText(page, previewSelector);
        return text.includes(keyword);
    });

export const waitForActiveTab = async page =>
    waitUntil(async () => {
        const activeTabSelector = ".frame-item .toolbar.nav.nav-tabs a.active";
        await waitForElement(page, activeTabSelector);
        return await getElementText(page, activeTabSelector);
    });

export const findElementWithText = async (page, query, textContent) => {
    const elements = await page.$$(query);

    const texts = await page.$$eval(query, elements =>
        elements.map(el => el.textContent),
    );

    const idx = texts.findIndex(t => t.indexOf(textContent) >= 0);
    expect(idx).toBeGreaterThan(-1);

    return elements[idx];
};

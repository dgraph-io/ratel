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
    return await puppeteer.launch({});
}

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

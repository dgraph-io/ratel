/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dgraph from 'dgraph-js-http'
import puppeteer from 'puppeteer'

export const DGRAPH_SERVER =
  process.env.TEST_DGRAPH_SERVER || 'http://localhost:8080'
const RATEL_URL = process.env.TEST_RATEL_URL || 'http://localhost:3000'

export async function setupBrowser() {
  // Chrome's sandbox needs unprivileged user namespaces, which Ubuntu 23.10+
  // restricts via AppArmor, so the browser cannot start on CI runners or in
  // most containers: "No usable sandbox!". Dropping the sandbox is acceptable
  // there because these tests only ever load our own Ratel on localhost, and
  // local runs keep it enabled. CI="false" is treated as not set, since
  // package.json sets exactly that on several scripts.
  // --disable-dev-shm-usage makes Chrome use /tmp instead of the small /dev/shm
  // runners provide, which is a common cause of mid-run "Target closed" crashes.
  const inCI = process.env.CI && process.env.CI !== 'false'
  const args = inCI
    ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    : []

  return await puppeteer.launch({
    args,
    defaultViewport: { width: 1280, height: 1024 },
  })
}

export const sleep = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay))

export const waitUntil = async (
  fn,
  { timeout = 20000, step = 20, page } = {},
) => {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const ret = await fn()
    if (ret) {
      return ret
    }
    await sleep(step)
  }
  let errorMsg = `Timeout ${timeout}ms exceeded`
  if (page) {
    // Colons are illegal in upload-artifact paths (and on Windows), so the
    // timestamp cannot go in raw or CI silently discards every screenshot.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const path = `screenshot_${stamp}.png`
    await page.screenshot({ path })
    console.error(`Error Screenshot captured: ${path}`)
    errorMsg = `Timeout ${timeout}ms exceeded. SCREENSHOT[${path}]`
  }
  throw new Error(errorMsg)
}

export const waitForElement = async (page, query, { timeout = 10000 } = {}) => {
  try {
    return await waitUntil(() => page.$(query), { page, timeout })
  } catch (err) {
    throw new Error(
      `Timeout waiting for element "${query}". Error: ${err.message}`,
    )
  }
}

export const waitForElementDisappear = async (
  page,
  query,
  { timeout = 10000 } = {},
) => {
  try {
    return await waitUntil(async () => !(await page.$(query)), {
      page,
      timeout,
    })
  } catch (err) {
    throw new Error(
      `Timeout waiting for element to disappear "${query}". Error: ${err.message}`,
    )
  }
}

// page.click() resolves a bounding box and then dispatches mouse events at
// those coordinates, so if the element is re-rendered in between, the click
// lands on a detached node and is lost — silently, with no error. Clicking
// through the DOM cannot miss. Prefer this for buttons that only toggle state.
export const clickElement = async (page, query) => {
  await waitForElement(page, query)
  await page.evaluate((q) => document.querySelector(q).click(), query)
}

export const waitForEditor = async (page) =>
  waitForElement(page, '.editor-panel .CodeMirror-cursors')

export const createTestTab = async (browser) => {
  const page = await browser.newPage()
  // naive check to see if RATEL_URL already has query params
  if (RATEL_URL.includes('?')) {
    await page.goto(`${RATEL_URL}&addr=${DGRAPH_SERVER}`)
  } else {
    await page.goto(`${RATEL_URL}?addr=${DGRAPH_SERVER}`)
  }

  return page
}

export const createHttpClient = async () => {
  const stub = new dgraph.DgraphClientStub(DGRAPH_SERVER)
  await stub.login('groot', 'password')
  return new dgraph.DgraphClient(stub)
}

export const typeAndRun = async (page, query) => {
  await waitForElement(page, '.editor-panel .CodeMirror')
  // Simulated keystrokes are unreliable in CodeMirror (it drops characters
  // at automation speed), so set the query through the editor API instead.
  // Tests pass unclosed queries — autoCloseBrackets used to complete them
  // while typing — so balance the braces here.
  await page.evaluate((q) => {
    let text = q
    const open = (text.match(/{/g) || []).length
    const close = (text.match(/}/g) || []).length
    text += '}'.repeat(Math.max(0, open - close))
    const cm = document.querySelector('.editor-panel .CodeMirror').CodeMirror
    cm.focus()
    cm.setValue(text)
  }, query)
  // Let the editor value sync to the store before running.
  await sleep(500)
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.editor-panel button')]
    buttons.find((b) => b.textContent.includes('Run')).click()
  })
}

export const easyUid = () =>
  `${Date.now() % 9973}_${Math.round(Math.random() * 9967)}`

export const getElementText = async (page, query) =>
  await page.$eval(query, (el) => el.textContent)

export const waitForFramePreview = async (page, keyword) =>
  waitUntil(
    async () => {
      const previewSelector = '.frame-header .preview'
      await waitForElement(page, previewSelector)
      const text = await getElementText(page, previewSelector)
      return text.includes(keyword)
    },
    { page },
  )

export const waitForActiveTab = async (page) =>
  waitUntil(
    async () => {
      const activeTabSelector = '.frame-item .toolbar.nav.nav-tabs a.active'
      await waitForElement(page, activeTabSelector)
      return await getElementText(page, activeTabSelector)
    },
    { page },
  )

export const findElementWithText = async (page, query, textContent) => {
  const elements = await page.$$(query)

  const texts = await page.$$eval(query, (elements) =>
    elements.map((el) => el.textContent),
  )

  const idx = texts.findIndex((t) => t.indexOf(textContent) >= 0)
  expect(idx).toBeGreaterThan(-1)

  return elements[idx]
}

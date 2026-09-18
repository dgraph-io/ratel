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

// Same reasoning as clickElement, for the handles that $$ hands back.
export const clickHandle = async (handle) => handle.evaluate((el) => el.click())

// Puppeteer delivers a whole string of keystrokes in a few milliseconds. A
// controlled React input cannot keep up on a loaded machine — it reconciles a
// truncated value, or none at all — which is the same problem typeAndRun works
// around for CodeMirror. Hand React the finished string in one update instead:
// it tracks its own value on the node, so the prototype setter plus a single
// input event is what it actually listens to. Then confirm the value landed.
export const fillField = async (page, query, value) => {
  await waitForElement(page, query)
  await page.evaluate(
    ([q, v]) => {
      const element = document.querySelector(q)
      const prototype =
        element instanceof window.HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype
      if (!(element instanceof window.HTMLElement) || !('value' in element)) {
        // Without this the descriptor lookup below fails with an opaque
        // "Cannot read properties of null" from inside the page.
        throw new Error(`fillField: "${q}" is not an input or textarea`)
      }
      const setValue = Object.getOwnPropertyDescriptor(prototype, 'value').set
      setValue.call(element, v)
      element.dispatchEvent(new Event('input', { bubbles: true }))
    },
    [query, value],
  )
  await waitUntil(
    async () => (await page.$eval(query, (e) => e.value)) === value,
    {
      page,
    },
  )
}

export const waitForEditor = async (page) =>
  waitForElement(page, '.editor-panel .CodeMirror-cursors')

export const createTestTab = async (browser) => {
  const page = await browser.newPage()

  // Set TEST_CPU_THROTTLE=4 to slow the page down to a quarter speed, which
  // approximates a loaded CI runner. Most failures this suite has had on CI were
  // races that never lose on developer hardware; this is how to reproduce one
  // locally rather than guessing from a CI log. Off unless the variable is set.
  // The CDP session is scoped to this page and goes away with it.
  if (process.env.TEST_CPU_THROTTLE) {
    const cdp = await page.createCDPSession()
    await cdp.send('Emulation.setCPUThrottlingRate', {
      rate: Number(process.env.TEST_CPU_THROTTLE),
    })
  }

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

// Every other helper here polls; this one used to look exactly once and assert,
// so callers that expected it to wait for a render instead failed on the first
// frame with an unhelpful "Received: -1". Poll until the text shows up.
export const findElementWithText = async (page, query, textContent) => {
  try {
    return await waitUntil(
      async () => {
        const elements = await page.$$(query)
        if (!elements.length) {
          return null
        }
        const texts = await page.$$eval(query, (found) =>
          found.map((el) => el.textContent),
        )
        const idx = texts.findIndex((t) => t.indexOf(textContent) >= 0)
        return idx < 0 ? null : elements[idx]
      },
      { page },
    )
  } catch (err) {
    throw new Error(
      `Timeout waiting for "${query}" containing "${textContent}". Error: ${err.message}`,
    )
  }
}

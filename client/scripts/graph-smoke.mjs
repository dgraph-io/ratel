// Smoke test: drive the real Ratel UI (with the new SigmaGraph renderer)
// against the local Dgraph, run a query, and verify the WebGL graph renders.
import puppeteer from 'puppeteer'

const RATEL = 'http://localhost:3000'
const DGRAPH = 'http://localhost:8080'

const die = async (msg) => {
  console.error('FAIL:', msg)
  process.exit(1)
}

// 0. Login to Dgraph (ACL is enabled on this cluster).
const loginRes = await fetch(`${DGRAPH}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userid: 'groot', password: 'password' }),
}).then((r) => r.json())
const accessJwt = loginRes.data && loginRes.data.accessJWT
if (!accessJwt)
  await die('dgraph login failed: ' + JSON.stringify(loginRes).slice(0, 300))
console.log('dgraph login ok')

// 1. Seed a small graph (namespaced predicate to avoid clobbering user data).
const stamp = `smoke${Date.now() % 99991}`
const rdf = `
  _:a <${stamp}_name> "Alice" .
  _:b <${stamp}_name> "Bob" .
  _:c <${stamp}_name> "Carol" .
  _:a <${stamp}_friend> _:b .
  _:a <${stamp}_friend> _:c .
  _:b <${stamp}_friend> _:c .
`
const mutateRes = await fetch(`${DGRAPH}/mutate?commitNow=true`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/rdf',
    'X-Dgraph-AccessToken': accessJwt,
  },
  body: `{ set { ${rdf} } }`,
}).then((r) => r.json())
if (!mutateRes.data || mutateRes.data.code !== 'Success') {
  await die('mutation failed: ' + JSON.stringify(mutateRes).slice(0, 300))
}
console.log('seeded test data')

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath:
    process.env.CHROME_BIN ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  defaultViewport: { width: 1280, height: 1024 },
})
const page = await browser.newPage()

const pageErrors = []
const consoleErrors = []
page.on('pageerror', (err) => pageErrors.push(String(err)))
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('response', async (res) => {
  if (/login|admin/.test(res.url())) {
    let body = ''
    try {
      body = (await res.text()).slice(0, 300)
    } catch {}
    console.log('NET', res.status(), res.url(), body)
  }
})

const waitGone = async (sel, timeout = 20000) => {
  const start = Date.now()
  while (await page.$(sel)) {
    if (Date.now() - start > timeout)
      await die('timeout waiting for ' + sel + ' to disappear')
    await new Promise((r) => setTimeout(r, 200))
  }
}

await page.goto(`${RATEL}?addr=${DGRAPH}`, { waitUntil: 'networkidle2' })
await page.waitForSelector('.editor-panel .CodeMirror-cursors', {
  timeout: 20000,
})
console.log('app loaded')

// 2. Login through the UI (ACL cluster).
if (!(await page.$('.modal.server-connection #serverUrlInput'))) {
  await page.click('.sidebar-menu a[href="#connection"]')
}
await page.waitForSelector('#useridInput', { timeout: 10000 })
await page.click('#useridInput', { clickCount: 3 })
await page.keyboard.type('groot')
await page.click('#passwordInput', { clickCount: 3 })
await page.keyboard.type('password')
const loginClicked = await page.$$eval(
  '.modal.server-connection .modal-body button.btn.btn-primary',
  (btns) => {
    const b = btns.find((x) => x.textContent === 'Login')
    if (b) b.click()
    return !!b
  },
)
if (!loginClicked) await die('no Login button found')
const spinner =
  '.modal.server-connection .modal-body button.btn-primary .fa-spinner.fa-pulse'
await page.waitForSelector(spinner, { timeout: 10000 }).catch(() => {})
await waitGone(spinner)
console.log('ui login done')

// Back to console tab.
await page.click(".sidebar-menu a[href='#']")
await page.waitForSelector('.editor-panel .CodeMirror-cursors', {
  timeout: 10000,
})
await page.click('.editor-panel .CodeMirror')

const query = `{ q(func: has(${stamp}_name)) { uid ${stamp}_name ${stamp}_friend { uid ${stamp}_name } } }`
await page.evaluate((q) => {
  document.querySelector('.editor-panel .CodeMirror').CodeMirror.setValue(q)
}, query)
await new Promise((r) => setTimeout(r, 1000))
await page.$$eval('.editor-panel button', (btns) => {
  const run = btns.find((b) => b.textContent.trim() === 'Run')
  if (run) run.click()
})
console.log('query submitted')

// 3. The graph container + sigma canvases must appear.
try {
  await page.waitForSelector('.graph-container .sigma-graph-outer canvas', {
    timeout: 20000,
  })
} catch {
  await page.screenshot({ path: '/tmp/sigma-fail.png' })
  console.error('pageErrors:', JSON.stringify(pageErrors, null, 2))
  console.error(
    'consoleErrors:',
    JSON.stringify(consoleErrors.slice(0, 10), null, 2),
  )
  const frameText = await page.evaluate(() => {
    const f = document.querySelector('.frame-item') || document.body
    return f.innerText.slice(0, 600)
  })
  console.error('frame text:', frameText)
  await die('graph canvas never appeared')
}
// Give the FA2 layout a moment to spread the nodes.
await new Promise((r) => setTimeout(r, 4000))

const info = await page.evaluate(() => {
  const canvases = document.querySelectorAll('.sigma-graph-outer canvas')
  const panel = document.querySelector('.graph-stats')
  let webgl = false
  for (const c of canvases) {
    if (c.getContext('webgl2') || c.getContext('webgl')) webgl = true
  }
  return {
    canvasCount: canvases.length,
    webgl,
    panelText: panel ? panel.innerText.replace(/\n/g, ' ').slice(0, 200) : null,
  }
})
console.log('render info:', JSON.stringify(info))

if (info.canvasCount < 2)
  await die('expected sigma canvas layers, got ' + info.canvasCount)
if (!info.webgl) await die('no WebGL context on sigma canvases')
if (!/3 nodes(.|\n)*3 edges/.test(info.panelText || ''))
  await die('graph stats mismatch: ' + info.panelText)

// Exercise the new toolbar: search for a node and zoom-to-fit.
await page.$eval('.graph-search input', (el) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  ).set
  setter.call(el, 'Alice')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.focus('.graph-search input')
await page.keyboard.press('Enter')
await new Promise((r) => setTimeout(r, 800))
await page.$eval('.graph-control-btn', (b) => b.click())
await new Promise((r) => setTimeout(r, 800))
console.log('search + zoomToFit exercised')

// 4. Screenshot for the human.
await page.screenshot({ path: '/tmp/sigma-graph.png' })

if (pageErrors.length) await die('page errors: ' + pageErrors.join(' | '))
const realConsoleErrors = consoleErrors.filter(
  (e) => !/favicon|manifest|ERR_BLOCKED|sourcemap|404/i.test(e),
)
if (realConsoleErrors.length)
  console.warn('console errors (non-fatal):', realConsoleErrors.slice(0, 5))

console.log('PASS: sigma graph rendered 3 nodes / 3 edges via WebGL')
await browser.close()

// Smoke test: serves the repo, loads every tool in headless Chromium, and
// fails on any uncaught page error. Run with `npm test`.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function startServer(root) {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    const filePath = path.join(root, path.normalize(reqPath));
    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    // Port 0 = any free port, so a busy 4173 can't fail the run.
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function run() {
  const server = await startServer(process.cwd());
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  // Third-party CDNs (fonts, pdf.js, html2pdf) are not under test and may be
  // unreachable in CI; answer them locally so pages still finish loading.
  await context.route(
    (url) => url.hostname !== '127.0.0.1',
    (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
  );

  const checks = [];
  const failures = [];

  async function openPage(name, urlPath) {
    const page = await context.newPage();
    page.on('pageerror', (err) => failures.push(`${name}: ${err.message}`));
    page.on('dialog', (dialog) =>
      dialog.type() === 'prompt' ? dialog.accept('Smoke Test') : dialog.accept()
    );
    const res = await page.goto(base + urlPath, { waitUntil: 'load', timeout: 60000 });
    if (!res || !res.ok()) throw new Error(`${name}: HTTP ${res && res.status()}`);
    checks.push(`${name}:loaded`);
    return page;
  }

  try {
    // ---- Planner ----------------------------------------------------------
    const planner = await openPage('planner', '/');
    await planner.waitForSelector('#profileSelect', { timeout: 10000 });
    await planner.waitForSelector('#calendarGrid .day, #calendarGrid > *', { timeout: 10000 });
    checks.push('planner:core-ui');

    // Every entry in the Teacher Tools menu must point at a page that exists.
    const toolLinks = await planner.$$eval('#teacherTools option', (opts) =>
      opts.map((o) => o.value).filter(Boolean)
    );
    for (const tool of toolLinks) {
      const res = await context.request.get(`${base}/${tool}/`);
      if (!res.ok()) failures.push(`planner: Teacher Tools entry "${tool}" is a dead link`);
    }
    checks.push(`planner:tool-links(${toolLinks.length})`);

    // Every header action must be selectable without throwing.
    for (const id of ['leftActions2', 'leftActions1']) {
      const values = await planner.$$eval(`#${id} option`, (opts) =>
        opts.map((o) => o.value).filter(Boolean)
      );
      // restore/print/export/publish open pickers or new windows; skip those.
      for (const v of values.filter((x) => ['syncBackupNow', 'special', 'dark'].includes(x))) {
        await planner.selectOption(`#${id}`, v);
        await planner.waitForTimeout(300);
      }
    }
    checks.push('planner:header-actions');

    await planner.selectOption('#profileActions', 'rename');
    await planner.waitForTimeout(300);
    checks.push('planner:profile-rename');

    const status = await planner.$eval('#autoBackupStatus', (el) => el.textContent.trim());
    if (!status) failures.push('planner: auto-backup status badge is empty');
    checks.push(`planner:backup-status(${status})`);

    // State must survive a reload.
    await planner.reload({ waitUntil: 'load' });
    await planner.waitForSelector('#profileSelect', { timeout: 10000 });
    checks.push('planner:reload');
    await planner.close();

    // ---- Other tools ------------------------------------------------------
    for (const tool of ['tracker', 'unit-builder', 'content-studio']) {
      const page = await openPage(tool, `/${tool}/`);
      await page.waitForTimeout(500);
      const hasUi = await page.evaluate(() => document.body.innerText.trim().length > 0);
      if (!hasUi) failures.push(`${tool}: rendered an empty page`);
      await page.close();
    }

    if (failures.length) throw new Error(failures.join('\n  '));
    console.log('SMOKE_RESULT:PASS');
    for (const c of checks) console.log(`CHECK:${c}`);
  } catch (err) {
    console.log('SMOKE_RESULT:FAIL');
    for (const c of checks) console.log(`CHECK:${c}`);
    console.log(`ERROR:${err.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function startServer(root, port = 4173) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const safePath = path.normalize(reqPath).replace(/^\.\.(\/|\\|$)/, '');
    const filePath = path.join(root, safePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8'
      };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const root = process.cwd();
  const port = 4173;
  const base = `http://127.0.0.1:${port}`;
  const server = await startServer(root, port);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const failures = [];
  const checks = [];

  page.on('pageerror', (err) => failures.push(`pageerror: ${err.message}`));

  try {
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
    checks.push('load:ok');

    // Handle any initial confirm/alert/prompt without hanging.
    page.on('dialog', async dialog => {
      const type = dialog.type();
      if (type === 'prompt') await dialog.accept('Smoke Test');
      else await dialog.accept();
    });

    // Basic key elements.
    await page.waitForSelector('#profileSelect', { timeout: 10000 });
    await page.waitForSelector('#leftActions1', { timeout: 10000 });
    checks.push('core-ui:ok');

    // Custom calendar should be hidden on built-in default.
    const customVisible = await page.$eval(
      '.config-section[data-section-key="custom-calendar"]',
      (el) => getComputedStyle(el).display !== 'none'
    );
    checks.push(`custom-visible:${customVisible}`);

    // Trigger manual sync via dropdown action.
    await page.selectOption('#leftActions1', 'syncBackupNow');
    await page.waitForTimeout(1200);
    checks.push('sync-action:triggered');

    // Trigger set external backup action (may be unavailable in headless; should not crash).
    await page.selectOption('#leftActions1', 'setExternalBackup');
    await page.waitForTimeout(1200);
    checks.push('set-external-action:triggered');

    // Status badge exists and has text.
    const statusText = await page.$eval('#autoBackupStatus', (el) => el.textContent.trim());
    checks.push(`status:${statusText}`);

    // Smoke quick profile action path via dropdown (open/cancel prompt handled).
    await page.selectOption('#profileActions', 'rename');
    await page.waitForTimeout(500);
    checks.push('profile-rename-action:triggered');

    // Evaluate local backup key existence.
    const localBackupKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.startsWith('autoBackup_'));
    });
    checks.push(`local-auto-backup-keys:${localBackupKeys.length}`);

    // Fail if runtime errors captured.
    if (failures.length) {
      throw new Error(failures.join(' | '));
    }

    console.log('SMOKE_RESULT:PASS');
    for (const c of checks) console.log(`CHECK:${c}`);
  } catch (err) {
    console.log('SMOKE_RESULT:FAIL');
    for (const c of checks) console.log(`CHECK:${c}`);
    console.log(`ERROR:${err.message}`);
    if (failures.length) console.log(`RUNTIME_ERRORS:${failures.join(' | ')}`);
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run();

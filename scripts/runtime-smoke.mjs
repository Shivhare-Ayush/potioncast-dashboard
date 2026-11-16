// scripts/runtime-smoke.mjs — Autonomous Playwright Smoke Test
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PORT = 8792;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

// 1. Start local server
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;
  if (pathname === '/') pathname = '/index.html';
  let filePath = path.join(PUBLIC_DIR, pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.end('Error');
      return;
    }
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'text/plain');
    res.end(data);
  });
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[Smoke Test] Server running on port ${PORT}`);

let exitCode = 0;
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  // Navigate with mock bypass flag
  console.log(`[Smoke Test] Navigating to http://localhost:${PORT}/?mock=1...`);
  await page.goto(`http://localhost:${PORT}/?mock=1`, { waitUntil: 'networkidle' });

  // 1. Verify App Container & Gate
  const lockVisible = await page.locator('#lock-screen').isVisible();
  if (lockVisible) {
    throw new Error('Lock screen should be hidden in mock/dev mode');
  }
  const appVisible = await page.locator('#app-container').isVisible();
  if (!appVisible) {
    throw new Error('App container should be visible');
  }
  console.log('✓ Auth gate & container verified');

  // 2. Verify Tab 1: KPI Dashboard
  const cashText = await page.locator('.metric-value').first().textContent();
  if (!cashText.includes('$84,210')) {
    throw new Error(`Expected $84,210 cash, got ${cashText}`);
  }
  const popupsTable = await page.locator('text=Magic Eye | San Marcos').isVisible();
  if (!popupsTable) {
    throw new Error('Pop-ups unit economics table missing');
  }
  console.log('✓ Tab 1 (KPI Dashboard) verified: Cash $84,210 & Pop-ups rendered');

  // 3. Verify Tab 2: Event Calendar
  await page.click('button[data-tab="calendar"]');
  await page.waitForTimeout(200);
  const calendarTitle = await page.locator('#view-title').textContent();
  if (!calendarTitle.includes('All cities calendar')) {
    throw new Error(`Expected "All cities calendar", got ${calendarTitle}`);
  }
  const inProgress = await page.locator('text=In progress').first().isVisible();
  const day22Event = await page.locator('.day-event:has-text("Spring arts festival")').isVisible();
  if (!inProgress || !day22Event) {
    throw new Error('Calendar milestones or pipeline cards missing');
  }
  console.log('✓ Tab 2 (Event Calendar) verified: All cities calendar & November grid rendered');

  // 4. Verify Tab 3: Marketing
  await page.click('button[data-tab="marketing"]');
  await page.waitForTimeout(200);
  const marketingTitle = await page.locator('#view-title').textContent();
  if (!marketingTitle.includes('Marketing')) {
    throw new Error(`Expected "Marketing", got ${marketingTitle}`);
  }
  const flywheelCard = await page.locator('text=Characters → attractions').isVisible();
  const cohortBoth = await page.locator('text=47%').isVisible();
  if (!flywheelCard || !cohortBoth) {
    throw new Error('Flywheel cards or cohort retention proof missing');
  }
  console.log('✓ Tab 3 (Marketing) verified: Flywheel cross-conversion & 47% cohort retention proof rendered');

  // Capture screenshot proof
  const reportsDir = path.join(ROOT_DIR, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const screenshotPath = path.join(reportsDir, 'dashboard-runtime-proof.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✓ Proof screenshot saved to ${screenshotPath}`);

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
  }

  console.log('\n🌟 ALL RUNTIME SMOKE TESTS PASSED WITH 0 ERRORS!');
} catch (err) {
  console.error('\n❌ Smoke test failed:', err);
  exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.close();
  process.exit(exitCode);
}

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

// Load local environment variables for tests
if (fs.existsSync(path.join(ROOT_DIR, '.env.local'))) {
  const envContent = fs.readFileSync(path.join(ROOT_DIR, '.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

// 1. Start local server with function routing
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;

  // Handle /api/* routes
  if (pathname.startsWith('/api/')) {
    const fnName = pathname.replace('/api/', '');
    try {
      const modulePath = path.join(ROOT_DIR, 'netlify', 'functions', `${fnName}.js`);
      const { handler } = await import(`file://${modulePath}`);
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const response = await handler({ httpMethod: req.method, body }, {});
          res.statusCode = response.statusCode || 200;
          for (const [k, v] of Object.entries(response.headers || {})) {
            res.setHeader(k, v);
          }
          res.end(response.body);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

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
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  // Test 1: Lock Screen & OTP Flow
  console.log(`[Smoke Test] Navigating to http://localhost:${PORT}/ (unauthenticated)...`);
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

  const lockVisible = await page.locator('#lock-screen').isVisible();
  if (!lockVisible) {
    throw new Error('Lock screen should be visible when unauthenticated');
  }
  console.log('✓ Lock screen correctly displayed');

  // Attempt unauthorized login
  console.log('[Smoke Test] Testing unauthorized email attempt...');
  await page.fill('#operator-email', 'intruder@unknown.com');
  await page.click('#btn-send-code');
  await page.waitForTimeout(400);

  const errorText = await page.locator('#auth-status').textContent();
  if (!errorText.includes('Access Denied')) {
    throw new Error(`Expected "Access Denied" error, got "${errorText}"`);
  }
  console.log('✓ Unauthorized access successfully rejected');

  // Attempt authorized operator login
  console.log('[Smoke Test] Testing authorized operator OTP flow...');
  await page.fill('#operator-email', 'ayush@potioncast.com');
  await page.click('#btn-send-code');
  await page.waitForSelector('#auth-step-otp', { state: 'visible', timeout: 5000 });
  console.log('✓ OTP generation step reached');

  // Click verify
  await page.click('#btn-verify-code');
  await page.waitForSelector('#app-container', { state: 'visible', timeout: 5000 });
  console.log('✓ Operator successfully verified and entered dashboard');

  // Test 2: KPI Dashboard tab
  const cashText = await page.locator('.metric-value').first().textContent();
  console.log('✓ KPI Dashboard loaded with cash metric:', cashText);

  // Test 3: Event Calendar tab
  await page.click('button[data-tab="calendar"]');
  await page.waitForTimeout(200);
  const calendarTitle = await page.locator('#view-title').textContent();
  if (!calendarTitle.includes('All cities calendar')) {
    throw new Error(`Expected "All cities calendar", got ${calendarTitle}`);
  }
  console.log('✓ Tab 2 (Event Calendar) verified');

  // Test 4: Marketing tab
  await page.click('button[data-tab="marketing"]');
  await page.waitForTimeout(200);
  const marketingTitle = await page.locator('#view-title').textContent();
  if (!marketingTitle.includes('Marketing')) {
    throw new Error(`Expected "Marketing", got ${marketingTitle}`);
  }
  console.log('✓ Tab 3 (Marketing) verified');

  // Capture screenshot proof
  const reportsDir = path.join(ROOT_DIR, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const screenshotPath = path.join(reportsDir, 'dashboard-runtime-proof.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✓ Proof screenshot saved to ${screenshotPath}`);

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
  }

  console.log('\n🌟 ALL RUNTIME SMOKE TESTS (INCLUDING OTP AUTH) PASSED WITH 0 ERRORS!');
} catch (err) {
  console.error('\n❌ Smoke test failed:', err);
  exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.close();
  process.exit(exitCode);
}

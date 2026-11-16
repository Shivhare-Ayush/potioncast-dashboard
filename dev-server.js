// dev-server.js â€” Lightweight local server for potioncast-dashboard
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8790;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;

  // Local route for /api/metrics & /api/auth-otp
  if (pathname.startsWith('/api/')) {
    const fnName = pathname.replace('/api/', '');
    try {
      const fn = require(`./netlify/functions/${fnName}.js`);
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const response = await fn.handler({ httpMethod: req.method, body }, {});
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
      console.error(`Local ${pathname} error:`, e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  if (pathname === '/') pathname = '/index.html';

  let filePath = path.join(PUBLIC_DIR, pathname);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // Check if file exists, else fallback to index.html (SPA redirect)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.end('Internal Server Error');
      return;
    }
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`ðŸš€ Potioncast Dashboard running at http://localhost:${PORT}`);
});

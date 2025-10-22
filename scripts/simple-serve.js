#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const subjectExtractDir = path.join(rootDir, 'src', 'data', 'subjectExtracts');
const DEFAULT_PORT = 5173;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const safeJoin = (base, targetPath) => {
  const target = path.normalize(path.join(base, targetPath));
  if (!target.startsWith(base)) {
    return null;
  }
  return target;
};

const listSubjectExtracts = () => {
  const files = [];
  const visit = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.txt')) {
        const relativePath = path.relative(rootDir, entryPath).split(path.sep).join('/');
        files.push({
          path: `/${relativePath}`,
          label: relativePath.replace(/^src\/data\/subjectExtracts\//, ''),
        });
      }
    }
  };

  try {
    visit(subjectExtractDir);
  } catch (error) {
    console.warn('[simple-serve] Unable to build subject extract list:', error);
  }

  files.sort((a, b) => a.label.localeCompare(b.label));
  return files;
};

const manifestHandler = (res) => {
  const manifest = {
    generatedAt: new Date().toISOString(),
    files: listSubjectExtracts(),
  };

  const body = JSON.stringify(manifest, null, 2);
  res.writeHead(200, {
    'Content-Type': mimeTypes['.json'],
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const serveFile = (res, filePath, method) => {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', (error) => {
      console.error('[simple-serve] Failed to read file:', error);
      if (!res.headersSent) {
        res.statusCode = 500;
      }
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  const method = req.method || 'GET';
  if (!['GET', 'HEAD'].includes(method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname.startsWith('/assets/')) {
    pathname = `/dist${pathname}`;
  }

  if (pathname === '/subject-extracts.json') {
    manifestHandler(res);
    return;
  }

  if (pathname === '/' || pathname === '') {
    pathname = '/preview.html';
  }

  const filePath = safeJoin(rootDir, pathname);
  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (indexError) => {
        if (!indexError) {
          serveFile(res, indexPath, method);
        } else {
          res.statusCode = 403;
          res.end('Directory access is forbidden');
        }
      });
      return;
    }

    serveFile(res, filePath, method);
  });
});

const parsePort = () => {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--port' || arg === '-p') {
      const value = Number(args[index + 1]);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
      continue;
    }

    const numeric = Number(arg);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return undefined;
};

const portFromArgs = parsePort();
const envPort = Number(process.env.PORT);
const port = portFromArgs || (Number.isFinite(envPort) && envPort > 0 ? envPort : DEFAULT_PORT);

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
  console.log('Serving static files from', rootDir);
  console.log('Navigate to / to open preview.html');
});

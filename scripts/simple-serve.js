#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
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
  const target = path.resolve(base, targetPath);
  if (!target.startsWith(base)) {
    return null;
  }
  return target;
};

const parseOptions = () => {
  const options = { port: undefined, mode: 'auto' };
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--port' || arg === '-p') {
      const value = Number(args[index + 1]);
      if (Number.isFinite(value) && value > 0) {
        options.port = value;
        index += 1;
        continue;
      }
    }

    if (arg.startsWith('--mode=')) {
      options.mode = arg.split('=')[1] ?? options.mode;
      continue;
    }

    if (arg === '--mode') {
      const value = args[index + 1];
      if (value) {
        options.mode = value;
        index += 1;
      }
      continue;
    }

    if (arg === '--dist' || arg === '--use-dist') {
      options.mode = 'dist';
      continue;
    }

    if (arg === '--preview') {
      options.mode = 'preview';
      continue;
    }

    const numeric = Number(arg);
    if (Number.isFinite(numeric) && numeric > 0) {
      options.port = numeric;
    }
  }

  return options;
};

const options = parseOptions();
const portFromArgs = options.port;
const requestedMode = String(options.mode || 'auto').toLowerCase();

const distIndexPath = path.join(distDir, 'index.html');
const hasDistBundle = fs.existsSync(distIndexPath);

let useDist = requestedMode === 'dist' || (requestedMode === 'auto' && hasDistBundle);
if (requestedMode === 'preview') {
  useDist = false;
}

if (requestedMode === 'dist' && !hasDistBundle) {
  console.warn('[simple-serve] dist/index.html not found; falling back to preview.html.');
  console.warn('[simple-serve] Run "npm run build" before launching the preview to serve the compiled application.');
}

const defaultDocumentPath = useDist && hasDistBundle ? distIndexPath : path.join(rootDir, 'preview.html');

const basePriority = useDist && hasDistBundle ? [distDir, rootDir] : [rootDir, distDir];

const listSubjectExtracts = () => {
  const files = [];

  const visit = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      return;
    }

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
      res.statusCode = statError && statError.code === 'ENOENT' ? 404 : 403;
      res.end(statError && statError.code === 'ENOENT' ? 'Not Found' : 'Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': contentType };

    const isImmutableAsset =
      filePath.includes(`${path.sep}assets${path.sep}`) && /\.[0-9a-f]{8,}\./i.test(path.basename(filePath));
    if (isImmutableAsset) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    res.writeHead(200, headers);

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

const createCandidatePaths = (pathname) => {
  const trimmed = pathname.replace(/^[/\\]+/, '');
  const candidates = new Set();

  for (const base of basePriority) {
    if (!base) continue;

    const direct = safeJoin(base, trimmed);
    if (direct) {
      candidates.add(direct);
    }

    if (trimmed) {
      if (base === rootDir) {
        const legacy = safeJoin(base, path.join('dist', trimmed));
        if (legacy) {
          candidates.add(legacy);
        }
      }

      if (base === distDir && trimmed.startsWith('dist/')) {
        const withoutPrefix = safeJoin(base, trimmed.replace(/^dist\//, ''));
        if (withoutPrefix) {
          candidates.add(withoutPrefix);
        }
      }
    }
  }

  return Array.from(candidates);
};

const tryCandidates = (res, candidates, method) => {
  if (candidates.length === 0) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const [current, ...rest] = candidates;
  fs.stat(current, (statError, stats) => {
    if (statError) {
      tryCandidates(res, rest, method);
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(current, 'index.html');
      fs.stat(indexPath, (indexError, indexStats) => {
        if (!indexError && indexStats.isFile()) {
          serveFile(res, indexPath, method);
        } else {
          tryCandidates(res, rest, method);
        }
      });
      return;
    }

    if (stats.isFile()) {
      serveFile(res, current, method);
      return;
    }

    tryCandidates(res, rest, method);
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
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/subject-extracts.json') {
    manifestHandler(res);
    return;
  }

  if (pathname === '/' || pathname === '') {
    serveFile(res, defaultDocumentPath, method);
    return;
  }

  const candidates = createCandidatePaths(pathname);
  tryCandidates(res, candidates, method);
});

const envPort = Number(process.env.PORT);
const port = portFromArgs || (Number.isFinite(envPort) && envPort > 0 ? envPort : DEFAULT_PORT);

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
  if (useDist && hasDistBundle) {
    console.log('[simple-serve] Serving compiled interface from dist/index.html');
  } else {
    console.log('[simple-serve] Serving static preview shell from preview.html');
    if (!hasDistBundle) {
      console.log('[simple-serve] Build output not found. Run "npm run build" to generate dist/ for the full application.');
    }
  }
  console.log('[simple-serve] Static roots:', basePriority.join(', '));
  console.log('[simple-serve] Use "--mode=preview" to force the marketing shell or "--mode=dist" to require the compiled app.');
});

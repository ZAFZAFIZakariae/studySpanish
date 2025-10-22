#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const subjectExtractDir = path.join(rootDir, 'src', 'data', 'subjectExtracts');
const subjectsDir = path.join(rootDir, 'subjects');
const extractionImagesDir = path.join(subjectsDir, 'tmp-extracted-images');
const extractsOutputDir = path.join(rootDir, 'src', 'data', 'subjectExtracts');
const publicDir = path.join(rootDir, 'public');
const publicAssetsDir = path.join(publicDir, 'subject-assets');
const DEFAULT_PORT = 5173;
const PYTHON_BIN = process.env.PYTHON_PATH || process.env.PYTHON || 'python3';

const { mkdir, writeFile, copyFile } = fsPromises;

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

const readRequestBody = (req, limit = 10 * 1024 * 1024) =>
  new Promise((resolve, reject) => {
    let body = '';
    let received = 0;

    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > limit) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });

    req.on('end', () => resolve(body));
    req.on('error', (error) => reject(error));
  });

const sendJson = (res, statusCode, payload) => {
  if (res.headersSent) {
    res.end();
    return;
  }

  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': mimeTypes['.json'],
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const resolveScriptPath = () => path.join(rootDir, 'scripts', 'extract_subject_texts.py');
const resolveImagesDir = () => path.join(subjectsDir, 'tmp-extracted-images');

const extractPdf = async (filePath) => {
  if (!filePath) {
    throw new Error('A file path must be provided for PDF extraction');
  }

  const scriptPath = resolveScriptPath();
  const imagesDir = resolveImagesDir();
  const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  const relativeToSubjects = path.relative(subjectsDir, absoluteFilePath);

  if (relativeToSubjects.startsWith('..') || path.isAbsolute(relativeToSubjects)) {
    throw new Error('The provided file path must point to a PDF inside the subjects directory.');
  }

  return await new Promise((resolve, reject) => {
    const extractor = spawn(
      PYTHON_BIN,
      [scriptPath, '--single-pdf', absoluteFilePath, '--images-dir', imagesDir],
      { stdio: ['ignore', 'pipe', 'pipe'], env: process.env }
    );

    let stdout = '';
    let stderr = '';

    extractor.stdout.setEncoding('utf8');
    extractor.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    extractor.stderr.setEncoding('utf8');
    extractor.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    extractor.on('error', (error) => {
      const wrapped = new Error(`Failed to start extraction script: ${error.message}`);
      wrapped.cause = error;
      reject(wrapped);
    });

    extractor.on('close', (code) => {
      if (code !== 0) {
        const details = stderr.trim();
        const message = details ? ` ${details}` : '';
        reject(new Error(`PDF extraction failed with exit code ${code}.${message}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const text = typeof parsed.text === 'string' ? parsed.text : '';
        const images = Array.isArray(parsed.images) ? parsed.images : [];
        resolve({ text, images });
      } catch (error) {
        const wrapped = new Error(
          error instanceof Error ? `Failed to parse extractor output: ${error.message}` : 'Failed to parse extractor output'
        );
        wrapped.cause = error instanceof Error ? error : undefined;
        if (stderr.trim()) {
          wrapped.details = stderr.trim();
        }
        reject(wrapped);
      }
    });
  });
};

const handleApiExtract = async (req, res, method) => {
  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  let payload;
  try {
    const rawBody = await readRequestBody(req);
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    console.warn('[simple-serve] Failed to parse /api/extract payload:', error);
    sendJson(res, 400, { error: 'Invalid JSON payload' });
    return;
  }

  const filePath = typeof payload?.filePath === 'string' ? payload.filePath.trim() : '';

  if (!filePath) {
    sendJson(res, 400, { error: 'A filePath string must be provided' });
    return;
  }

  try {
    const result = await extractPdf(filePath);
    sendJson(res, 200, result);
  } catch (error) {
    console.error('[simple-serve] Failed to extract PDF', error);
    sendJson(res, 500, { error: 'Failed to extract PDF content' });
  }
};

const handleApiSaveExtract = async (req, res, method) => {
  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  let payload;
  try {
    const rawBody = await readRequestBody(req);
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    console.warn('[simple-serve] Failed to parse /api/save-extract payload:', error);
    sendJson(res, 400, { error: 'Invalid JSON payload' });
    return;
  }

  const filePath = typeof payload?.filePath === 'string' ? payload.filePath.trim() : '';
  const markdown = typeof payload?.markdown === 'string' ? payload.markdown : '';
  const assetsInput = Array.isArray(payload?.assets) ? payload.assets : [];

  if (!filePath) {
    sendJson(res, 400, { error: 'A filePath string must be provided' });
    return;
  }

  if (!markdown) {
    sendJson(res, 400, { error: 'A markdown string must be provided' });
    return;
  }

  const absoluteSourcePath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  const relativeSubjectPath = path.relative(subjectsDir, absoluteSourcePath);

  if (relativeSubjectPath.startsWith('..') || path.isAbsolute(relativeSubjectPath)) {
    sendJson(res, 400, {
      error: 'The provided filePath must point to a file inside the subjects directory.',
    });
    return;
  }

  const relativeDirectory = path.dirname(relativeSubjectPath);
  const baseName = path.basename(relativeSubjectPath, path.extname(relativeSubjectPath));
  const outputDirectory = path.resolve(
    extractsOutputDir,
    path.join('subjects', relativeDirectory === '.' ? '' : relativeDirectory)
  );
  const outputPath = path.resolve(outputDirectory, `${baseName}.txt`);

  try {
    await mkdir(outputDirectory, { recursive: true });
    const content = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
    await writeFile(outputPath, content, { encoding: 'utf8', flag: 'w' });
  } catch (error) {
    console.error('[simple-serve] Failed to write extract', error);
    sendJson(res, 500, { error: 'Failed to write extract file' });
    return;
  }

  const assetsToCopy = [];
  for (const entry of assetsInput) {
    if (
      entry &&
      typeof entry.originalPath === 'string' &&
      typeof entry.targetPath === 'string'
    ) {
      const originalPath = entry.originalPath.trim();
      const targetPath = entry.targetPath.trim();
      if (originalPath && targetPath) {
        assetsToCopy.push({ originalPath, targetPath });
      }
    }
  }

  try {
    for (const asset of assetsToCopy) {
      const sourcePath = path.isAbsolute(asset.originalPath)
        ? asset.originalPath
        : path.resolve(rootDir, asset.originalPath);
      const relativeTempPath = path.relative(extractionImagesDir, sourcePath);

      if (relativeTempPath.startsWith('..') || path.isAbsolute(relativeTempPath)) {
        throw new Error('Asset path must originate from the temporary extraction directory.');
      }

      const normalisedTarget = asset.targetPath.replace(/\\+/g, '/').replace(/^\/+/, '');

      if (!normalisedTarget.startsWith('subject-assets/')) {
        throw new Error('Asset target path must be within the public/subject-assets directory.');
      }

      const destinationPath = path.resolve(publicDir, normalisedTarget);
      const relativeDestination = path.relative(publicAssetsDir, destinationPath);

      if (relativeDestination.startsWith('..') || path.isAbsolute(relativeDestination)) {
        throw new Error('Asset target path must be contained within public/subject-assets.');
      }

      await mkdir(path.dirname(destinationPath), { recursive: true });
      await copyFile(sourcePath, destinationPath);
    }
  } catch (error) {
    console.error('[simple-serve] Failed to copy extracted images', error);
    sendJson(res, 500, { error: 'Failed to copy extracted images' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    outputPath: path.relative(rootDir, outputPath).split(path.sep).join('/'),
  });
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
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/api/extract') {
    handleApiExtract(req, res, method).catch((error) => {
      console.error('[simple-serve] Unexpected error handling /api/extract', error);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Internal Server Error' });
      } else {
        res.end();
      }
    });
    return;
  }

  if (pathname === '/api/save-extract') {
    handleApiSaveExtract(req, res, method).catch((error) => {
      console.error('[simple-serve] Unexpected error handling /api/save-extract', error);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Internal Server Error' });
      } else {
        res.end();
      }
    });
    return;
  }

  if (!['GET', 'HEAD'].includes(method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

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

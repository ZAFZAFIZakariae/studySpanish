#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const subjectsDir = path.join(repoRoot, 'subjects');
const extractsDir = path.join(repoRoot, 'src', 'data', 'subjectExtracts');
const cacheDir = path.join(repoRoot, '.cache');
const manifestPath = path.join(cacheDir, 'subject-extracts-manifest.json');
const pythonScript = path.join(repoRoot, 'scripts', 'extract_subject_texts.py');
const watchedExtension = '.pdf';
const subjectAssetsDir = path.join(repoRoot, 'public', 'subject-assets');

function log(message) {
  process.stdout.write(`[ensure-subject-extracts] ${message}\n`);
}

async function listPdfFiles(dir) {
  const results = [];
  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return;
      }
      throw error;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const extension = path.extname(entry.name).toLowerCase();
      if (extension !== watchedExtension) {
        continue;
      }
      let stats;
      try {
        stats = await fs.stat(fullPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          continue;
        }
        throw error;
      }
      const relativePath = path.relative(subjectsDir, fullPath).split(path.sep).join('/');
      results.push({
        relativePath,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      });
    }
  }

  await walk(dir);
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

async function readManifest() {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const data = JSON.parse(content);
    if (!data || typeof data !== 'object' || !Array.isArray(data.files)) {
      return null;
    }
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    log(`Warning: unable to read manifest (${error.message}); assuming regeneration required.`);
    return null;
  }
}

function computeExtractPath(relativePdfPath) {
  const withoutExtension = relativePdfPath.slice(0, -path.extname(relativePdfPath).length);
  return path.join(extractsDir, `${withoutExtension}.txt`);
}

function computeAssetDir(relativePdfPath) {
  const withoutExtension = relativePdfPath.slice(0, -path.extname(relativePdfPath).length);
  return path.join(subjectAssetsDir, withoutExtension);
}

function directoryHasFiles(dir) {
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = fsSync.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (entry.isFile()) {
        return true;
      }
      if (entry.isDirectory()) {
        stack.push(path.join(current, entry.name));
      }
    }
  }

  return false;
}

function detectChanges(manifest, pdfFiles) {
  if (!manifest) {
    if (pdfFiles.length === 0) {
      return { needsUpdate: false, reason: 'No PDFs found and no manifest present.' };
    }
    return { needsUpdate: true, reason: 'No manifest found for PDF extracts.' };
  }

  const seen = new Set();
  const recorded = new Map(
    manifest.files.map((entry) => [entry.relativePath, entry])
  );

  for (const file of pdfFiles) {
    const entry = recorded.get(file.relativePath);
    const extractPath = computeExtractPath(file.relativePath);
    if (!fsSync.existsSync(extractPath)) {
      return { needsUpdate: true, reason: `Missing extract for ${file.relativePath}.` };
    }
    const extractContent = fsSync.readFileSync(extractPath, 'utf8');
    if (extractContent.includes('/subject-assets/')) {
      const assetDir = computeAssetDir(file.relativePath);
      if (!directoryHasFiles(assetDir)) {
        return { needsUpdate: true, reason: `Missing subject assets for ${file.relativePath}.` };
      }
    }
    seen.add(file.relativePath);
    if (!entry) {
      return { needsUpdate: true, reason: `New PDF detected: ${file.relativePath}.` };
    }
    if (entry.size !== file.size || Math.abs(entry.mtimeMs - file.mtimeMs) > 1) {
      return { needsUpdate: true, reason: `PDF changed: ${file.relativePath}.` };
    }
  }

  for (const key of recorded.keys()) {
    if (!seen.has(key)) {
      return { needsUpdate: true, reason: `PDF removed: ${key}.` };
    }
  }

  return { needsUpdate: false, reason: 'No PDF changes detected.' };
}

async function writeManifest(pdfFiles) {
  await fs.mkdir(cacheDir, { recursive: true });
  const payload = { files: pdfFiles };
  await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function runExtraction() {
  const candidates = [
    process.env.PYTHON,
    process.env.PYTHON3,
    'python3',
    'python',
  ].filter(Boolean);

  let lastError = null;

  for (const candidate of candidates) {
    const result = spawnSync(candidate, [pythonScript], {
      stdio: 'inherit',
      env: process.env,
    });
    if (result.error) {
      if (result.error.code === 'ENOENT') {
        lastError = result.error;
        continue;
      }
      throw result.error;
    }
    if (typeof result.status === 'number' && result.status !== 0) {
      throw new Error(`Extraction script exited with status ${result.status}.`);
    }
    return;
  }

  const attempted = candidates.join(', ');
  const message = lastError
    ? `Unable to locate Python interpreter (attempted: ${attempted}).`
    : 'Unable to execute extraction script.';
  throw new Error(message);
}

async function main() {
  const pdfFiles = await listPdfFiles(subjectsDir);
  const manifest = await readManifest();
  const { needsUpdate, reason } = detectChanges(manifest, pdfFiles);

  if (!needsUpdate) {
    log(reason);
    return;
  }

  log(`${reason} Running subject extraction pipeline...`);
  runExtraction();
  await writeManifest(pdfFiles);
  log('Subject extracts are up to date.');
}

main().catch((error) => {
  console.error(`[ensure-subject-extracts] ${error.message || error}`);
  process.exitCode = 1;
});

#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ASSETS_DIR = join(ROOT, 'public');
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

async function collectAssetFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectAssetFiles(fullPath)));
      } else {
        const lower = entry.name.toLowerCase();
        const dotIndex = lower.lastIndexOf('.');
        if (dotIndex === -1) {
          return;
        }
        const ext = lower.slice(dotIndex);
        if (BINARY_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    })
  );
  return files;
}

async function main() {
  const assetFiles = await collectAssetFiles(ASSETS_DIR);
  const emptyFiles = [];
  for (const file of assetFiles) {
    const { size } = await stat(file);
    if (size === 0) {
      emptyFiles.push(relative(ROOT, file));
    }
  }

  if (emptyFiles.length > 0) {
    console.error('The following asset files are empty and should contain data:\n');
    for (const file of emptyFiles) {
      console.error(` - ${file}`);
    }
    process.exitCode = 1;
    return;
  }

  if (assetFiles.length === 0) {
    console.warn('No binary assets found under public/.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

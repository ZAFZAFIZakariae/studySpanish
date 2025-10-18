/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

jest.setTimeout(30000);

const execFileAsync = promisify(execFile);

describe('PDF extraction pipeline', () => {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const fixturesDir = path.resolve(repoRoot, 'tests', 'fixtures');
  const samplePdf = path.join(fixturesDir, 'sample.pdf');
  const scriptPath = path.resolve(repoRoot, 'scripts', 'extract_subject_texts.py');
  const imagesDir = path.resolve(repoRoot, 'subjects', 'tmp-extracted-images');

  beforeAll(() => {
    fs.rmSync(imagesDir, { recursive: true, force: true });
  });

  afterAll(() => {
    fs.rmSync(imagesDir, { recursive: true, force: true });
  });

  it('writes extracted text with image references to disk', async () => {
    const { stdout } = await execFileAsync('python3', [
      scriptPath,
      '--single-pdf',
      samplePdf,
      '--images-dir',
      imagesDir,
    ], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
    });

    const payload = JSON.parse(stdout.trim());
    const text: string = payload.text;
    const images: Array<{ path: string }> = payload.images ?? [];

    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBeGreaterThan(0);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'extraction-test-'));
    const outputPath = path.join(tempDir, 'sample.txt');
    fs.writeFileSync(outputPath, text, 'utf8');

    const outputText = fs.readFileSync(outputPath, 'utf8');
    expect(outputText).toMatch(/!\[[^\]]+\]\([^\)]+\.png\)/);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

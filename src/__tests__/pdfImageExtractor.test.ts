/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

jest.setTimeout(30000);

const execFileAsync = promisify(execFile);

describe('pdf_image_extractor CLI', () => {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const fixturesDir = path.resolve(repoRoot, 'tests', 'fixtures');
  const samplePdf = path.join(fixturesDir, 'sample.pdf');
  const scriptPath = path.resolve(repoRoot, 'scripts', 'pdf_image_extractor.py');

  it('exports embedded images or page snapshots for PDFs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-images-'));

    try {
      const { stdout } = await execFileAsync('python3', [
        scriptPath,
        samplePdf,
        '--output',
        tempDir,
      ], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 20,
      });

      const payload = JSON.parse(stdout.trim());
      const images: Array<{ page: number; filename: string }> = payload.images ?? [];
      const counts = payload.counts ?? { embedded: 0, snapshots: 0 };

      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBeGreaterThan(0);
      expect(counts.embedded + counts.snapshots).toBe(images.length);

      for (const entry of images) {
        const imagePath = path.join(tempDir, entry.filename);
        expect(fs.existsSync(imagePath)).toBe(true);
      }
    } catch (error: any) {
      const combinedOutput = `${error.stdout || ''}${error.stderr || ''}`;
      if (/pymupdf/i.test(combinedOutput) || /fitz/i.test(combinedOutput)) {
        console.warn('Skipping pdf_image_extractor CLI test because PyMuPDF is not installed.');
        return;
      }
      throw error;
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

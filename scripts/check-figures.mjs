import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const lessonTextDir = path.join(repoRoot, 'src', 'data', 'lessonContents', 'text');
const lessonFiguresDir = path.join(repoRoot, 'src', 'components', 'lessonFigures');

const figureReferenceRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
const figureKeyRegex = /['\"]([^'\"]+)['\"]\s*:\s*\([^)]*\)\s*=>/g;

async function collectLessonFigureReferences() {
  const entries = await fs.readdir(lessonTextDir, { withFileTypes: true });
  const references = new Set();

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))
      .map(async (entry) => {
        const filePath = path.join(lessonTextDir, entry.name);
        const contents = await fs.readFile(filePath, 'utf8');

        for (const match of contents.matchAll(figureReferenceRegex)) {
          const source = match[1]?.trim();
          if (source?.startsWith('figure:')) {
            references.add(source.replace(/^figure:/, ''));
          }
        }
      })
  );

  return references;
}

async function collectDefinedFigureKeys() {
  const entries = await fs.readdir(lessonFiguresDir, { withFileTypes: true });
  const keys = new Set();

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')))
      .map(async (entry) => {
        const filePath = path.join(lessonFiguresDir, entry.name);
        const contents = await fs.readFile(filePath, 'utf8');

        for (const match of contents.matchAll(figureKeyRegex)) {
          keys.add(match[1]);
        }
      })
  );

  return keys;
}

function formatMissingFigureMessage(missingKeys) {
  const sorted = [...missingKeys].sort();
  const entries = sorted.map((key) => ` - ${key}`);
  return `Missing inline figure renderers for:\n${entries.join('\n')}`;
}

async function main() {
  const [references, definedKeys] = await Promise.all([
    collectLessonFigureReferences(),
    collectDefinedFigureKeys(),
  ]);

  const missing = new Set();
  for (const ref of references) {
    if (!definedKeys.has(ref)) {
      missing.add(ref);
    }
  }

  if (missing.size > 0) {
    console.error(formatMissingFigureMessage(missing));
    process.exitCode = 1;
    return;
  }

  console.log(`All ${references.size} inline lesson figures are registered.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

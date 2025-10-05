type GlobFunction = (pattern: string, options: { eager: true; as: 'raw' }) => Record<string, string>;

const resolveGlob = (): GlobFunction | undefined => {
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(
      'return typeof import.meta !== "undefined" && import.meta.glob ? import.meta.glob : undefined;'
    )();
    return typeof result === 'function' ? (result as GlobFunction) : undefined;
  } catch (error) {
    return undefined;
  }
};

const loadModulesWithFs = (): Record<string, string> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const rootDir = __dirname;
    const result: Record<string, string> = {};

    const visit = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          visit(entryPath);
        } else if (entry.isFile() && entry.name.endsWith('.txt')) {
          const relativePath = `./${path.relative(rootDir, entryPath).replace(/\\/g, '/')}`;
          result[relativePath] = fs.readFileSync(entryPath, 'utf8');
        }
      }
    };

    visit(rootDir);
    return result;
  } catch (error) {
    console.warn('[subjectExtracts] Unable to load extracted text via fs:', error);
    return {};
  }
};

const glob = resolveGlob();

const modules = glob ? glob('./**/*.txt', { eager: true, as: 'raw' }) : loadModulesWithFs();

type ExtractedSubjectText = {
  /** Path of the source asset inside the `subjects/` tree. */
  source: string;
  /** Normalised text extracted from the source asset, excluding the metadata header. */
  text: string;
  /** Optional extraction notes declared in the file header. */
  notes?: string[];
  /** Absolute module id used by Vite (useful for debugging). */
  moduleId: string;
};

const headerRegex = /^# Extracted content\nSource: (?<source>subjects\/[\s\S]+?)\n(?:Notes:\n(?<notes>(?:- .+\n)+))?/;

const map = new Map<string, ExtractedSubjectText>();

for (const [moduleId, raw] of Object.entries(modules)) {
  const rawText = raw.replace(/\r\n/g, '\n');
  const match = rawText.match(headerRegex);
  const source = match?.groups?.source?.trim();

  if (!source) {
    // Skip files that do not follow the expected header format.
    continue;
  }

  const notesBlock = match?.groups?.notes;
  const notes = notesBlock
    ?.split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((line) => line.length > 0);

  const text = rawText.replace(headerRegex, '').trim();

  map.set(source.toLowerCase(), {
    source,
    text,
    ...(notes && notes.length > 0 ? { notes } : {}),
    moduleId,
  });
}

export const subjectExtracts = map;

export const getSubjectExtract = (sourcePath: string): ExtractedSubjectText | undefined =>
  map.get(sourcePath.toLowerCase());

export type { ExtractedSubjectText };

type GlobFunction = (pattern: string, options: { eager: true; as: 'raw' }) => Record<string, string>;

const getImportMetaGlob = (): GlobFunction | undefined => {
  try {
    const meta = import.meta as unknown as { glob?: GlobFunction };
    return typeof meta.glob === 'function' ? meta.glob : undefined;
  } catch (error) {
    return undefined;
  }
};

const loadTextModulesWithFs = (): Record<string, string> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const rootDir = path.resolve(__dirname);
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
    console.warn('[lessonContents] Unable to read lesson text files via fs:', error);
    return {};
  }
};

const textModules = (() => {
  const glob = getImportMetaGlob();
  if (glob) {
    return glob('./**/*.txt', { eager: true, as: 'raw' }) as Record<string, string>;
  }
  return loadTextModulesWithFs();
})();

const normalizeLessonId = (path: string): string =>
  path
    .replace(/^\.\//, '')
    .replace(/\.txt$/, '')
    .replace(/\//g, '-')
    .toLowerCase();

const entries = Object.entries(textModules)
  .map(([path, content]) => [normalizeLessonId(path), content as string] as const)
  .sort(([a], [b]) => a.localeCompare(b));

export const lessonSummaryText: Record<string, string> = Object.fromEntries(entries);

export const englishLessonIds = new Set<string>([
  'admeav-slide-t0',
  'admeav-slide-t1',
  'admeav-slide-t2',
  'admeav-lab-sesion1',
  'admeav-notebook-glcm',
  'admeav-notebook-lbp',
  'admeav-notebook-sift',
  'snlp-chapter-1',
  'snlp-chapter-2',
  'snlp-chapter-3',
  'snlp-chapter-4',
  'snlp-chapter-5',
  'snlp-chapter-6',
]);

export const lessonTextIndexBySubject = new Map<string, string[]>(
  entries.reduce((acc, [lessonId]) => {
    const subjectId = lessonId.split('-')[0];
    const list = acc.get(subjectId) ?? [];
    list.push(lessonId);
    acc.set(subjectId, list);
    return acc;
  }, new Map<string, string[]>())
);

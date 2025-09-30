type GlobResult = Record<string, string>;

type GlobFunction = (pattern: string, options: { eager: true; as: 'url' }) => GlobResult;

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

const glob = resolveGlob();
const resolveNodeModule = <T>(specifier: string): T | undefined => {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      'specifier',
      'return typeof require === "function" ? require(specifier) : undefined;'
    );
    const module = fn(specifier);
    return module ? (module as T) : undefined;
  } catch (error) {
    return undefined;
  }
};

const loadNodeAssetModules = (): GlobResult => {
  if (typeof process === 'undefined' || !process.versions?.node) {
    return {};
  }

  const fs = resolveNodeModule<typeof import('node:fs')>('node:fs');
  const path = resolveNodeModule<typeof import('node:path')>('node:path');

  if (!fs || !path) {
    return {};
  }

  const projectRoot = process.cwd();
  const subjectsDir = path.resolve(projectRoot, 'subjects');

  if (!fs.existsSync(subjectsDir)) {
    return {};
  }

  const entries: GlobResult = {};

  const visit = (directory: string) => {
    const dirEntries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of dirEntries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (!/\.(png|jpe?g|svg|webp)$/i.test(entry.name)) {
        continue;
      }

      const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
      entries[`../../${relativePath}`] = fullPath;
    }
  };

  visit(subjectsDir);

  return entries;
};

const assetModules: GlobResult = glob
  ? glob('../../subjects/**/*.{png,jpg,jpeg,svg,webp}', {
      eager: true,
      as: 'url',
    })
  : loadNodeAssetModules();

const lessonFigureAssets = new Map<string, string>();

const normalizeKey = (key: string) =>
  key
    .replace(/^\.\.\//, '')
    .replace(/^subjects\//, '')
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, '-')
    .toLowerCase();

for (const [path, url] of Object.entries(assetModules)) {
  lessonFigureAssets.set(normalizeKey(path), url as string);
}

export const resolveFigureAsset = (figureId: string): string | undefined => {
  const normalizedId = figureId.replace(/_/g, '-').toLowerCase();
  if (!normalizedId) {
    return undefined;
  }

  if (lessonFigureAssets.has(normalizedId)) {
    return lessonFigureAssets.get(normalizedId);
  }

  for (const [key, value] of lessonFigureAssets) {
    if (key.endsWith(normalizedId)) {
      return value;
    }
  }

  return undefined;
};

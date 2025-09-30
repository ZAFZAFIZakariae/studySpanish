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

const assetModules: GlobResult = glob
  ? glob('../../subjects/**/*.{png,jpg,jpeg,svg,webp}', {
      eager: true,
      as: 'url',
    })
  : {};

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

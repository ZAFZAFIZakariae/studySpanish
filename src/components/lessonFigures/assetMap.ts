type GlobResult = Record<string, string>;

import figureAssetModules from './assetModules';

const assetModules: GlobResult = (() => {
  if (figureAssetModules && Object.keys(figureAssetModules).length > 0) {
    return figureAssetModules;
  }
  return {};
})();

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

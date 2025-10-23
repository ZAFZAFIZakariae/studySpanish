type GlobResult = Record<string, string>;

import { resolveSubjectAssetPath } from '@/lib/subjectAssets';
import figureAssetModules from './assetModules';

const assetModules: GlobResult = (() => {
  if (figureAssetModules && Object.keys(figureAssetModules).length > 0) {
    return figureAssetModules;
  }
  return {};
})();

const lessonFigureAssets = new Map<string, string>();

const normalizeKey = (key: string) => {
  const normalizedPath = key
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^public\/subject-assets\//i, '')
    .replace(/^subject-assets\//i, '')
    .replace(/^subjects\//, '')
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, '-')
    .replace(/\/+/g, '/')
    .toLowerCase();

  return normalizedPath;
};

for (const [path, url] of Object.entries(assetModules)) {
  lessonFigureAssets.set(normalizeKey(path), url as string);
}

export const resolveFigureAsset = (identifier: string): string | undefined => {
  if (!identifier) {
    return undefined;
  }

  const normalizedId = normalizeKey(identifier);
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

  const normalizedIdentifier = identifier.replace(/\\/g, '/').toLowerCase();
  if (/subject-assets|subjects/.test(normalizedIdentifier)) {
    const fallbackSubjectAsset = resolveSubjectAssetPath(identifier);
    if (fallbackSubjectAsset && fallbackSubjectAsset !== identifier) {
      return fallbackSubjectAsset;
    }
  }

  return undefined;
};

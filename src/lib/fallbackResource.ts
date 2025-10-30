import { CourseItem, ResourceLink } from '../types/subject';

export type FallbackResourceExtract = {
  label: string;
  href: string;
  text: string;
};

const normalizeValue = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const tokenizeForMatch = (value?: string | null): string[] => {
  if (!value) {
    return [];
  }

  const normalized = normalizeValue(value);
  return normalized ? normalized.split(' ') : [];
};

const buildIdentifier = (resource: ResourceLink): string => {
  const source = resource.filePath ?? resource.href ?? resource.label;
  return source ? source.trim().toLowerCase() : '';
};

const buildTokenSet = (resource: ResourceLink): Set<string> =>
  new Set([
    ...tokenizeForMatch(resource.label),
    ...tokenizeForMatch(resource.filePath),
    ...tokenizeForMatch(resource.extract?.source),
  ]);

const buildItemTokenSet = (item: CourseItem | null): Set<string> => {
  if (!item) {
    return new Set();
  }

  const tokens = new Set<string>();
  tokenizeForMatch(item.title).forEach((token) => tokens.add(token));
  tokenizeForMatch(item.id).forEach((token) => tokens.add(token));
  return tokens;
};

type FallbackCandidate = {
  resource: ResourceLink;
  text: string;
  priority: number;
  order: number;
};

export const pickFallbackResource = (
  item: CourseItem | null,
  itemResources: ResourceLink[],
  resourcesWithExtract: ResourceLink[]
): FallbackResourceExtract | null => {
  const pools: ResourceLink[] = [...itemResources, ...resourcesWithExtract];
  const seen = new Set<string>();
  const itemTokens = buildItemTokenSet(item);
  const normalizedTitle = item ? normalizeValue(item.title) : '';
  const candidates: FallbackCandidate[] = [];

  pools.forEach((resource, index) => {
    const extractText = resource.extract?.text?.trim();
    if (!extractText) {
      return;
    }

    const identifier = buildIdentifier(resource);
    if (!identifier || seen.has(identifier)) {
      return;
    }

    seen.add(identifier);

    const resourceTokens = buildTokenSet(resource);
    let priority = index < itemResources.length ? 200 : 0;

    itemTokens.forEach((token) => {
      if (resourceTokens.has(token)) {
        priority += 10;
      }
    });

    if (normalizedTitle) {
      const labelNormalized = normalizeValue(resource.label ?? '');
      const filePathNormalized = resource.filePath ? normalizeValue(resource.filePath) : '';

      if (labelNormalized.includes(normalizedTitle)) {
        priority += 50;
      } else if (filePathNormalized.includes(normalizedTitle)) {
        priority += 40;
      }
    }

    candidates.push({
      resource,
      text: extractText,
      priority,
      order: index,
    });
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return a.order - b.order;
  });

  const best = candidates[0];
  return {
    label: best.resource.label,
    href: best.resource.href,
    text: best.text,
  };
};

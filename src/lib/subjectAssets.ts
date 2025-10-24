export const SUBJECT_ASSET_PREFIX = '/subject-assets/';

const isExternalAsset = (value: string) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value) || value.startsWith('data:') || value.startsWith('blob:');

const encodePathSegment = (segment: string): string => {
  const trimmed = segment.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return encodeURIComponent(decodeURIComponent(trimmed));
  } catch (error: unknown) {
    if (error instanceof URIError) {
      return encodeURIComponent(trimmed);
    }
    throw error;
  }
};

const normalisePathSegments = (rawSrc: string): string[] => {
  const normalized = rawSrc.replace(/\\/g, '/');
  const trimmed = normalized.trim();
  const segments: string[] = [];

  for (const segment of trimmed.split('/')) {
    if (!segment || segment === '.') {
      continue;
    }

    if (segment === '..') {
      if (segments.length > 0) {
        segments.pop();
      }
      continue;
    }

    segments.push(segment);
  }

  if (segments[0]?.toLowerCase() === 'public' && segments[1]?.toLowerCase() === 'subject-assets') {
    segments.shift();
  }

  if (segments[0]?.toLowerCase() === 'subjects') {
    segments.shift();
  }

  if (segments[0]?.toLowerCase() === 'subject-assets') {
    segments.shift();
  }

  return segments
    .map((segment) => encodePathSegment(segment))
    .filter((segment) => segment.length > 0);
};

export const resolveSubjectAssetPath = (rawSrc: string): string => {
  const trimmed = rawSrc.trim();
  if (!trimmed) {
    return '';
  }

  if (isExternalAsset(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, '/');
  const suffixIndex = normalized.search(/[?#]/);
  const suffix = suffixIndex === -1 ? '' : normalized.slice(suffixIndex);
  const withoutSuffix = suffixIndex === -1 ? normalized : normalized.slice(0, suffixIndex);

  const segments = normalisePathSegments(withoutSuffix);
  const sanitisedPath = segments.join('/');
  const prefix = SUBJECT_ASSET_PREFIX.endsWith('/') ? SUBJECT_ASSET_PREFIX : `${SUBJECT_ASSET_PREFIX}/`;

  return sanitisedPath ? `${prefix}${sanitisedPath}${suffix}` : `${prefix}${suffix}`;
};

export const resolveLessonImageSource = (rawSrc: string): string => {
  const trimmed = rawSrc.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('figure:')) {
    return trimmed;
  }

  if (isExternalAsset(trimmed)) {
    return trimmed;
  }

  return resolveSubjectAssetPath(trimmed);
};

export const isSubjectAssetUrl = (rawSrc: string): boolean => {
  const resolved = resolveSubjectAssetPath(rawSrc);
  return Boolean(resolved) && resolved.startsWith(SUBJECT_ASSET_PREFIX);
};

export { isExternalAsset };

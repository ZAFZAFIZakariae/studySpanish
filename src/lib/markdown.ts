const SAFE_PROTOCOLS = ['http', 'https', 'mailto', 'tel', 'figure'] as const;

const startsWithSafeProtocol = (value: string, colonIndex: number): boolean => {
  const lower = value.slice(0, colonIndex).toLowerCase();
  return SAFE_PROTOCOLS.some((protocol) => lower === protocol);
};

const PUBLIC_SUBJECT_ASSET_SEGMENT = 'public/subject-assets/';

const normalizePublicSubjectAssetUri = (value: string): string | null => {
  const normalized = value.replace(/\\/g, '/');
  const segmentIndex = normalized.indexOf(PUBLIC_SUBJECT_ASSET_SEGMENT);

  if (segmentIndex === -1) {
    return null;
  }

  const precedingChar = segmentIndex > 0 ? normalized.charAt(segmentIndex - 1) : '';
  if (precedingChar && precedingChar !== '/' && precedingChar !== '.') {
    return null;
  }

  const assetPath = normalized.slice(segmentIndex + PUBLIC_SUBJECT_ASSET_SEGMENT.length);
  return `/subject-assets/${assetPath}`.replace(/\/{2,}/g, '/');
};

export const transformMarkdownImageUri = (uri: string): string => {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  if (!trimmed) {
    return '';
  }

  const normalizedPublicAssetPath = normalizePublicSubjectAssetUri(trimmed);
  if (normalizedPublicAssetPath) {
    return normalizedPublicAssetPath;
  }

  const firstChar = trimmed.charAt(0);
  if (firstChar === '#' || firstChar === '/') {
    return trimmed;
  }

  const colonIndex = trimmed.indexOf(':');
  if (colonIndex === -1) {
    return trimmed;
  }

  if (startsWithSafeProtocol(trimmed, colonIndex)) {
    return trimmed;
  }

  const queryIndex = trimmed.indexOf('?');
  if (queryIndex !== -1 && colonIndex > queryIndex) {
    return trimmed;
  }

  const hashIndex = trimmed.indexOf('#');
  if (hashIndex !== -1 && colonIndex > hashIndex) {
    return trimmed;
  }

  return 'javascript:void(0)';
};

export default transformMarkdownImageUri;

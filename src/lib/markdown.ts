const SAFE_PROTOCOLS = ['http', 'https', 'mailto', 'tel', 'figure'] as const;

const startsWithSafeProtocol = (value: string, colonIndex: number): boolean => {
  const lower = value.slice(0, colonIndex).toLowerCase();
  return SAFE_PROTOCOLS.some((protocol) => lower === protocol);
};

export const transformMarkdownImageUri = (uri: string): string => {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  if (!trimmed) {
    return '';
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

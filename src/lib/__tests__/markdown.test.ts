import { transformMarkdownImageUri } from '../markdown';

describe('transformMarkdownImageUri', () => {
  it('returns empty string for falsy values', () => {
    expect(transformMarkdownImageUri('')).toBe('');
    expect(transformMarkdownImageUri('   ')).toBe('');
  });

  it('preserves figure URIs exactly', () => {
    expect(transformMarkdownImageUri('figure:demo/diagram')).toBe('figure:demo/diagram');
    expect(transformMarkdownImageUri('  FIGURE:demo/diagram  ')).toBe('FIGURE:demo/diagram');
  });

  it('allows safe protocols and relative paths', () => {
    expect(transformMarkdownImageUri('https://example.com/image.png')).toBe('https://example.com/image.png');
    expect(transformMarkdownImageUri('mailto:user@example.com')).toBe('mailto:user@example.com');
    expect(transformMarkdownImageUri('subjects/ggo/sample.png')).toBe('subjects/ggo/sample.png');
    expect(transformMarkdownImageUri('#diagram-anchor')).toBe('#diagram-anchor');
  });

  it('falls back to javascript:void(0) for unknown protocols', () => {
    expect(transformMarkdownImageUri('javascript:alert(1)')).toBe('javascript:void(0)');
    expect(transformMarkdownImageUri('data:text/plain;base64,AAAA')).toBe('javascript:void(0)');
  });

  it('handles URLs with queries and fragments before protocol separator', () => {
    expect(transformMarkdownImageUri('some/path?query=value:still-safe')).toBe('some/path?query=value:still-safe');
    expect(transformMarkdownImageUri('some/path#hash:value')).toBe('some/path#hash:value');
  });
});

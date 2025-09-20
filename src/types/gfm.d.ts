/**
 * Ambient declarations for the GitHub-flavored markdown utilities used by
 * react-markdown. The upstream packages ship ESM-only bundles, which can trip
 * up TypeScript's module resolution in some tooling setups.
 */
declare module 'micromark-extension-gfm' {
  export type Options = Record<string, unknown>;
  export function gfm(options?: Options | null): unknown;
}

declare module 'mdast-util-gfm' {
  export type Options = Record<string, unknown>;
  export function gfmFromMarkdown(): unknown;
  export function gfmToMarkdown(options?: Options | null): unknown;
}

// The project now provides its own `remarkGfm` implementation, so the
// upstream `remark-gfm` package is no longer pulled in directly.

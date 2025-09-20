export type Options = Record<string, unknown>;

/**
 * Stub implementation used when `micromark-extension-gfm` is unavailable.
 *
 * The stub intentionally returns `null` so the Remark plugin can fall back to
 * a lightweight table parser instead of failing the build. Consumers should
 * install the real dependency to retain the full GitHub-flavored Markdown
 * feature set.
 */
export function gfm(_: Options | null | undefined) {
  return null;
}

export function gfmHtml(_: Options | null | undefined) {
  return null;
}

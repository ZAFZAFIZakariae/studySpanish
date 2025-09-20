import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Options as MicromarkGfmOptions } from 'micromark-extension-gfm';
import type { Options as MdastGfmOptions } from 'mdast-util-gfm';
import { gfm as micromarkGfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';

interface RemarkData {
  micromarkExtensions?: unknown[];
  fromMarkdownExtensions?: unknown[];
  toMarkdownExtensions?: unknown[];
}

type CombinedOptions = MicromarkGfmOptions & MdastGfmOptions;

export type RemarkGfmOptions = CombinedOptions | null | undefined;

/**
 * Lightweight reimplementation of the core logic from `remark-gfm`.
 *
 * We vendor the functionality to avoid depending on the full package at
 * runtime, which previously caused build failures when the module was missing
 * from some environments. The behavior mirrors the upstream plugin by
 * injecting the required micromark and mdast extensions.
 */
const remarkGfm: Plugin<[RemarkGfmOptions?], Root> = function remarkGfm(options) {
  const settings = (options ?? {}) as CombinedOptions;
  const data = (this.data() as RemarkData);

  const micromarkExtensions = data.micromarkExtensions ?? (data.micromarkExtensions = []);
  const fromMarkdownExtensions = data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions = data.toMarkdownExtensions ?? (data.toMarkdownExtensions = []);

  micromarkExtensions.push(micromarkGfm(settings));
  fromMarkdownExtensions.push(gfmFromMarkdown());
  toMarkdownExtensions.push(gfmToMarkdown(settings));
};

export default remarkGfm;

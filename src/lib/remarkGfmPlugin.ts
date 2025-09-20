import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Options as MicromarkOptions } from 'micromark-extension-gfm';
import type { Options as MdastOptions } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';

/**
 * Lightweight local replica of the `remark-gfm` plugin.
 * Based on the MIT-licensed implementation at https://github.com/remarkjs/remark-gfm.
 */
export type RemarkGfmOptions = Partial<MicromarkOptions & MdastOptions>;

export const remarkGfmPlugin: Plugin<[RemarkGfmOptions?], Root> = function remarkGfm(
  options: RemarkGfmOptions = {}
) {
  const data = this.data();

  const add = (field: string, value: unknown) => {
    const list = (data[field] as unknown[]) ?? (data[field] = []);
    list.push(value);
  };

  add('micromarkExtensions', gfm(options));
  add('fromMarkdownExtensions', gfmFromMarkdown());
  add('toMarkdownExtensions', gfmToMarkdown(options));
};

export default remarkGfmPlugin;

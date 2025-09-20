import remarkParse from 'remark-parse';
import type {
  AlignType,
  Paragraph,
  PhrasingContent,
  Root,
  Table,
  TableCell,
  TableRow,
  Text,
} from 'mdast';
import type { Options as MicromarkGfmOptions } from 'micromark-extension-gfm';
import type { Options as MdastGfmOptions } from 'mdast-util-gfm';
import { gfm as micromarkGfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { unified, type Plugin } from 'unified';
import type { Parent } from 'unist';

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

  const extension = invokeMicromark(settings);

  if (extension) {
    micromarkExtensions.push(extension);
    fromMarkdownExtensions.push(gfmFromMarkdown());
    toMarkdownExtensions.push(gfmToMarkdown(settings));
    return;
  }

  logFallbackWarning();

  return (tree) => {
    applyFallbackTables(tree);
  };
};

export default remarkGfm;

let inlineParser: ReturnType<typeof unified> | undefined;
let loggedFallbackWarning = false;

function invokeMicromark(options: CombinedOptions) {
  try {
    return micromarkGfm(options as MicromarkGfmOptions);
  } catch (error) {
    logFallbackWarning(error instanceof Error ? error : undefined);
    return null;
  }
}

function logFallbackWarning(error?: Error) {
  if (loggedFallbackWarning || typeof console === 'undefined') {
    return;
  }

  loggedFallbackWarning = true;
  const message =
    'micromark-extension-gfm is unavailable. Falling back to a limited table parser. Install the package to restore full GitHub-flavored Markdown support.';

  if (error) {
    console.warn(message, error);
  } else {
    console.warn(message);
  }
}

function applyFallbackTables(tree: Root) {
  transformNode(tree as Parent);
}

function transformNode(node: Parent): void {
  const { children } = node as Parent & { children: unknown[] };
  if (!Array.isArray(children)) {
    return;
  }

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child || typeof child !== 'object') {
      continue;
    }

    if ((child as { type?: string }).type === 'paragraph') {
      const table = convertParagraphToTable(child as Paragraph);
      if (table) {
        children.splice(index, 1, table);
        continue;
      }
    }

    if ('children' in (child as Parent)) {
      transformNode(child as Parent);
    }
  }
}

function convertParagraphToTable(paragraph: Paragraph): Table | null {
  if (paragraph.children.length !== 1) {
    return null;
  }

  const [firstChild] = paragraph.children;
  if (!firstChild || firstChild.type !== 'text') {
    return null;
  }

  return parseTableBlock((firstChild as Text).value);
}

function parseTableBlock(value: string): Table | null {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return null;
  }

  const [headerLine, delimiterLine, ...bodyLines] = lines;

  if (!/\|/.test(headerLine) || !/^[:\-\s|]+$/.test(delimiterLine)) {
    return null;
  }

  const headerCells = splitRow(headerLine);
  const alignmentCells = splitRow(delimiterLine);

  if (!headerCells.length || !alignmentCells.length) {
    return null;
  }

  const alignmentInfo = alignmentCells.map(parseAlignmentCell);
  if (alignmentInfo.some((align) => align === undefined)) {
    return null;
  }

  const dataRows = bodyLines.map(splitRow);
  const columnCount = Math.max(
    headerCells.length,
    alignmentInfo.length,
    ...dataRows.map((row) => row.length)
  );

  if (!Number.isFinite(columnCount) || columnCount <= 0) {
    return null;
  }

  const align = Array.from({ length: columnCount }, (_, index) => alignmentInfo[index] ?? null) as AlignType[];

  const headerRow = createTableRow(headerCells, columnCount);
  const rows = dataRows.map((row) => createTableRow(row, columnCount));

  return {
    type: 'table',
    align,
    children: [headerRow, ...rows],
  };
}

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let escaping = false;

  for (const char of line) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  if (cells.length > 1 && cells[0] === '') {
    cells.shift();
  }

  if (cells.length > 1 && cells[cells.length - 1] === '') {
    cells.pop();
  }

  return cells;
}

function parseAlignmentCell(cell: string): AlignType | null | undefined {
  const trimmed = cell.trim();
  if (!trimmed) {
    return undefined;
  }

  const alignLeft = trimmed.startsWith(':');
  const alignRight = trimmed.endsWith(':');
  const core = trimmed.slice(alignLeft ? 1 : 0, alignRight ? -1 : undefined).trim();

  if (!/^-+$/.test(core)) {
    return undefined;
  }

  if (alignLeft && alignRight) {
    return 'center';
  }

  if (alignRight) {
    return 'right';
  }

  if (alignLeft) {
    return 'left';
  }

  return null;
}

function createTableRow(cells: string[], columnCount: number): TableRow {
  const normalized = Array.from({ length: columnCount }, (_, index) => cells[index] ?? '');

  const children: TableCell[] = normalized.map((cell) => ({
    type: 'tableCell',
    children: parseInlineContent(cell),
  }));

  return {
    type: 'tableRow',
    children,
  };
}

function parseInlineContent(value: string): PhrasingContent[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (!inlineParser) {
    inlineParser = unified().use(remarkParse);
  }

  const tree = inlineParser.parse(trimmed) as Root;
  const result: PhrasingContent[] = [];

  for (const node of tree.children) {
    if ((node as Paragraph).children && node.type === 'paragraph') {
      result.push(...((node as Paragraph).children as PhrasingContent[]));
    } else {
      result.push(node as PhrasingContent);
    }
  }

  if (result.length === 0) {
    result.push({ type: 'text', value: trimmed } as Text);
  }

  return result;
}

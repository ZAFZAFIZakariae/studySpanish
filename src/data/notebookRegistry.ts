import type { NotebookCell } from '../types/notebook';

interface NotebookRecord {
  path: string;
  downloadUrl: string;
  cells: NotebookCell[];
}

type GlobFn = (
  pattern: string,
  options: {
    eager: true;
    as: 'raw' | 'url';
  }
) => Record<string, string>;

const resolveGlob = (): GlobFn | undefined => {
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(
      'return typeof import.meta !== "undefined" && import.meta.glob ? import.meta.glob : undefined;'
    )();
    return typeof result === 'function' ? (result as GlobFn) : undefined;
  } catch (error) {
    return undefined;
  }
};

const glob = resolveGlob();

const rawNotebooks = glob
  ? glob('../../subjects/**/*.ipynb', {
      eager: true,
      as: 'raw',
    })
  : {};

const notebookFiles = glob
  ? glob('../../subjects/**/*.ipynb', {
      eager: true,
      as: 'url',
    })
  : {};

const NOTEBOOK_PREFIX = '../../';

const normalizePath = (rawPath: string) =>
  rawPath.startsWith(NOTEBOOK_PREFIX) ? rawPath.slice(NOTEBOOK_PREFIX.length) : rawPath;

const toNotebookCells = (raw: string): NotebookCell[] => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.cells)) {
      return [];
    }

    return parsed.cells
      .map((cell: any, index: number): NotebookCell | null => {
        if (!cell || typeof cell !== 'object') {
          return null;
        }

        const baseId = typeof cell.id === 'string' && cell.id.trim().length > 0 ? cell.id : `cell-${index}`;
        const source = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? '');
        const trimmedSource = source.replace(/\s+$/, '');

        if (cell.cell_type === 'markdown') {
          return {
            id: baseId,
            type: 'markdown',
            source: trimmedSource,
          };
        }

        if (cell.cell_type === 'code') {
          const outputs = Array.isArray(cell.outputs)
            ? cell.outputs.flatMap((output: any) => {
                if (!output) {
                  return [];
                }
                if (Array.isArray(output.text)) {
                  return output.text;
                }
                if (typeof output.text === 'string') {
                  return [output.text];
                }
                if (output.data && typeof output.data === 'object') {
                  const textData =
                    output.data['text/plain'] ||
                    output.data['application/vnd.jupyter.widget-view+json']?.model_id ||
                    output.data['application/json'];
                  if (Array.isArray(textData)) {
                    return textData;
                  }
                  if (typeof textData === 'string') {
                    return [textData];
                  }
                }
                return [];
              })
            : [];

          const formattedOutputs = outputs
            .map((value) => String(value).trimEnd())
            .filter((value) => value.length > 0);

          return {
            id: baseId,
            type: 'code',
            source: trimmedSource,
            outputs: formattedOutputs,
          };
        }

        return null;
      })
      .filter((cell): cell is NotebookCell => cell !== null);
  } catch (error) {
    console.warn('Failed to parse notebook', error);
    return [];
  }
};

const notebookRegistry = new Map<string, NotebookRecord>();

for (const [path, raw] of Object.entries(rawNotebooks)) {
  const normalizedPath = normalizePath(path);
  const downloadUrl = notebookFiles[path];
  if (!downloadUrl) {
    continue;
  }

  notebookRegistry.set(normalizedPath, {
    path: normalizedPath,
    downloadUrl,
    cells: toNotebookCells(raw as string),
  });
}

export const getNotebookRecord = (path: string): NotebookRecord | undefined => {
  const normalized = path.startsWith('subjects/') ? path : `subjects/${path.replace(/^\/?/, '')}`;
  return notebookRegistry.get(normalized);
};

const modules = import.meta.glob('./**/*.txt', { eager: true, as: 'raw' }) as Record<string, string>;

type ExtractedSubjectText = {
  /** Path of the source asset inside the `subjects/` tree. */
  source: string;
  /** Normalised text extracted from the source asset. */
  text: string;
  /** Absolute module id used by Vite (useful for debugging). */
  moduleId: string;
};

const headerRegex = /^# Extracted content\nSource: (?<source>subjects\/[\s\S]+?)\n(?:Notes:\n(?<notes>(?:- .+\n)+))?/;

const map = new Map<string, ExtractedSubjectText>();

for (const [moduleId, rawText] of Object.entries(modules)) {
  const match = rawText.match(headerRegex);
  const source = match?.groups?.source?.trim();
  const text = rawText.trim();

  if (!source) {
    // Skip files that do not follow the expected header format.
    continue;
  }

  map.set(source.toLowerCase(), {
    source,
    text,
    moduleId,
  });
}

export const subjectExtracts = map;

export const getSubjectExtract = (sourcePath: string): ExtractedSubjectText | undefined =>
  map.get(sourcePath.toLowerCase());

export type { ExtractedSubjectText };

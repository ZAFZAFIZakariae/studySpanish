import { LessonSummaryContent, TranslationSupport } from '../../types/subject';
import { lessonSummaries } from '../lessonSummaries';
import { englishLessonIds, lessonSummaryText } from './text';

const cloneTranslation = (translation?: TranslationSupport): TranslationSupport | undefined => {
  if (!translation) {
    return undefined;
  }

  const { glossary, ...rest } = translation;

  return {
    ...rest,
    ...(glossary ? { glossary: [...glossary] } : {}),
  };
};

const normalizeSummaryText = (rawText: string): string =>
  rawText
    .replace(/\r\n/g, '\n')
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g, '$1\n$2')
    .replace(/•/g, '\n• ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\n• /g, '\n• ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

const lessons: Record<string, LessonSummaryContent> = Object.fromEntries(
  Object.entries(lessonSummaries).map(([lessonId, summary]) => [
    lessonId,
    {
      summary: { ...summary.summary },
      ...(summary.translation ? { translation: cloneTranslation(summary.translation) } : {}),
    },
  ])
);

for (const [lessonId, text] of Object.entries(lessonSummaryText)) {
  const normalizedText = normalizeSummaryText(text);
  const summary = lessons[lessonId];
  const originalSummary = lessonSummaries[lessonId];

  if (!summary || !originalSummary) {
    throw new Error(`Missing lesson summary metadata for id: ${lessonId}`);
  }

  const existingOriginalSummary = originalSummary.summary.original?.trim();
  const existingEnglishSummary = originalSummary.summary.english?.trim();
  const existingContentOriginal = summary.content?.original?.trim();
  const existingContentEnglish = summary.content?.english?.trim();

  const combinedContentOriginal = existingContentOriginal
    ? `${existingContentOriginal}\n\n${normalizedText}`
    : normalizedText;

  const combinedContentEnglish = englishLessonIds.has(lessonId)
    ? existingContentEnglish
      ? `${existingContentEnglish}\n\n${normalizedText}`
      : normalizedText
    : existingContentEnglish;

  lessons[lessonId] = {
    ...summary,
    summary: {
      original: existingOriginalSummary ?? existingEnglishSummary ?? '',
      ...(existingEnglishSummary ? { english: existingEnglishSummary } : {}),
    },
    content: {
      original: combinedContentOriginal,
      ...(combinedContentEnglish ? { english: combinedContentEnglish } : {}),
    },
  };
}

export const lessonContents = lessons;

export const getLessonContent = (id: string): LessonSummaryContent => {
  const summary = lessons[id];

  if (!summary) {
    throw new Error(`Missing lesson content for id: ${id}`);
  }

  return summary;
};

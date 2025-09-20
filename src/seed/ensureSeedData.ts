import { db } from '../db';
import { Exercise, Flashcard, Lesson } from './seedTypes';
import { normalizeSeedInput } from './normalizeSeedBundle';

export const SEED_VERSION_KEY = 'seed-version';
export const DEFAULT_SEED_VERSION = '2024-05-07';
export const CUSTOM_SEED_MARKER = 'custom';

const seedFiles = import.meta.glob<string>('./**/*.json', { import: 'default', query: '?raw' });

const normalizeSeedJson = (raw: string) => {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (const char of raw) {
    if (inString) {
      if (isEscaped) {
        result += char;
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        result += char;
        isEscaped = true;
        continue;
      }
      if (char === '"') {
        result += char;
        inString = false;
        continue;
      }
      if (char === '\r') {
        continue;
      }
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      result += char;
      continue;
    }

    if (char === '"') {
      inString = true;
    }
    if (char !== '\r') {
      result += char;
    }
  }

  return result;
};

export type SeedResult = {
  seeded: boolean;
  counts: {
    lessons: number;
    exercises: number;
    flashcards: number;
  };
};

export async function ensureSeedData(): Promise<SeedResult> {
  const existingVersion = await db.settings.get(SEED_VERSION_KEY);
  const [lessonCount, exerciseCount, flashcardCount] = await Promise.all([
    db.lessons.count(),
    db.exercises.count(),
    db.flashcards.count(),
  ]);
  const hasData = lessonCount > 0 || exerciseCount > 0 || flashcardCount > 0;

  if (existingVersion?.value === CUSTOM_SEED_MARKER && hasData) {
    return {
      seeded: false,
      counts: { lessons: lessonCount, exercises: exerciseCount, flashcards: flashcardCount },
    };
  }

  if (existingVersion?.value === DEFAULT_SEED_VERSION && hasData) {
    return {
      seeded: false,
      counts: { lessons: lessonCount, exercises: exerciseCount, flashcards: flashcardCount },
    };
  }

  if (!existingVersion && hasData) {
    return {
      seeded: false,
      counts: { lessons: lessonCount, exercises: exerciseCount, flashcards: flashcardCount },
    };
  }

  const lessonMap = new Map<string, Lesson>();
  const exerciseMap = new Map<string, Exercise>();
  const flashcardMap = new Map<string, Flashcard>();

  for (const [path, loader] of Object.entries(seedFiles)) {
    if (path.endsWith('sections.json')) continue;
    try {
      const raw = await loader();
      const normalized = normalizeSeedJson(raw);
      let data: unknown;
      try {
        data = JSON.parse(normalized);
      } catch (error) {
        console.warn('Skipping seed file due to parse errors', path, error);
        continue;
      }
      const bundle = normalizeSeedInput(data, {
        onItemSkipped: (item) => console.warn('Skipping unrecognized item in seed file', path, item),
      });
      for (const lesson of bundle.lessons) {
        lessonMap.set(lesson.id, lesson);
      }
      for (const exercise of bundle.exercises) {
        exerciseMap.set(exercise.id, exercise);
      }
      for (const flashcard of bundle.flashcards) {
        flashcardMap.set(flashcard.id, flashcard);
      }
    } catch (error) {
      console.warn('Failed to load seed file', path, error);
    }
  }

  const lessons = Array.from(lessonMap.values());
  const exercises = Array.from(exerciseMap.values());
  const flashcards = Array.from(flashcardMap.values());

  if (lessons.length === 0 && exercises.length === 0 && flashcards.length === 0) {
    console.warn('Initial seed attempted but no seed data was loaded.');
    return { seeded: false, counts: { lessons: 0, exercises: 0, flashcards: 0 } };
  }

  await db.transaction('rw', [db.lessons, db.exercises, db.flashcards, db.settings], async () => {
    if (lessons.length) await db.lessons.bulkPut(lessons);
    if (exercises.length) await db.exercises.bulkPut(exercises);
    if (flashcards.length) await db.flashcards.bulkPut(flashcards);
    await db.settings.put({ key: SEED_VERSION_KEY, value: DEFAULT_SEED_VERSION });
  });

  return {
    seeded: true,
    counts: {
      lessons: lessons.length,
      exercises: exercises.length,
      flashcards: flashcards.length,
    },
  };
}

import { db } from '../db';
import {
  Exercise,
  Flashcard,
  Lesson,
  SeedBundleSchema,
} from '../lib/schemas';

export const SEED_VERSION_KEY = 'seed-version';
export const CUSTOM_SEED_MARKER = 'custom';

const rawSeedFiles = import.meta.glob('./**/*.{json,js}', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

type BundledSeed = {
  lessons: Lesson[];
  exercises: Exercise[];
  flashcards: Flashcard[];
};

type SeedCounts = {
  lessons: number;
  exercises: number;
  flashcards: number;
};

const stripBom = (value: string): string =>
  value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;

const aggregateSeedBundles = (): BundledSeed => {
  const lessonMap = new Map<string, Lesson>();
  const exerciseMap = new Map<string, Exercise>();
  const flashcardMap = new Map<string, Flashcard>();

  for (const [path, source] of Object.entries(rawSeedFiles)) {
    if (path.endsWith('sections.json')) continue;

    const cleaned = stripBom(source).trim();
    if (!cleaned) continue;

    let data: unknown;
    try {
      data = JSON.parse(cleaned);
    } catch (error) {
      console.warn('Skipping seed file due to parse errors', path, error);
      continue;
    }

    const parsed = SeedBundleSchema.safeParse(data);
    if (!parsed.success) {
      console.warn('Skipping seed file due to validation errors', path, parsed.error);
      continue;
    }

    for (const lesson of parsed.data.lessons) {
      if (lessonMap.has(lesson.id)) {
        console.warn(
          `Duplicate lesson id "${lesson.id}" encountered; keeping the last definition from ${path}.`,
        );
      }
      lessonMap.set(lesson.id, lesson);
    }

    for (const exercise of parsed.data.exercises) {
      if (exerciseMap.has(exercise.id)) {
        console.warn(
          `Duplicate exercise id "${exercise.id}" encountered; keeping the last definition from ${path}.`,
        );
      }
      exerciseMap.set(exercise.id, exercise);
    }

    for (const flashcard of parsed.data.flashcards) {
      if (flashcardMap.has(flashcard.id)) {
        console.warn(
          `Duplicate flashcard id "${flashcard.id}" encountered; keeping the last definition from ${path}.`,
        );
      }
      flashcardMap.set(flashcard.id, flashcard);
    }
  }

  const toSortedArray = <T extends { id: string }>(map: Map<string, T>) =>
    Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));

  return {
    lessons: toSortedArray(lessonMap),
    exercises: toSortedArray(exerciseMap),
    flashcards: toSortedArray(flashcardMap),
  };
};

const bundledSeed = aggregateSeedBundles();

const fnv1aHash = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const computeSeedVersion = ({ lessons, exercises, flashcards }: BundledSeed): string => {
  const payload = JSON.stringify({ lessons, exercises, flashcards });
  return `bundled-${fnv1aHash(payload)}`;
};

export const DEFAULT_SEED_VERSION = computeSeedVersion(bundledSeed);

export type SeedResult = {
  seeded: boolean;
  counts: SeedCounts;
};

const buildResult = (seeded: boolean, counts: SeedCounts): SeedResult => ({
  seeded,
  counts,
});

export async function ensureSeedData(): Promise<SeedResult> {
  const existingVersion = await db.settings.get(SEED_VERSION_KEY);
  const [lessonCount, exerciseCount, flashcardCount] = await Promise.all([
    db.lessons.count(),
    db.exercises.count(),
    db.flashcards.count(),
  ]);

  const currentCounts: SeedCounts = {
    lessons: lessonCount,
    exercises: exerciseCount,
    flashcards: flashcardCount,
  };
  const hasData = lessonCount > 0 || exerciseCount > 0 || flashcardCount > 0;

  if (existingVersion?.value === CUSTOM_SEED_MARKER && hasData) {
    return buildResult(false, currentCounts);
  }

  if (existingVersion?.value === DEFAULT_SEED_VERSION && hasData) {
    return buildResult(false, currentCounts);
  }

  if (!existingVersion && hasData) {
    return buildResult(false, currentCounts);
  }

  if (
    bundledSeed.lessons.length === 0 &&
    bundledSeed.exercises.length === 0 &&
    bundledSeed.flashcards.length === 0
  ) {
    console.warn('Initial seed attempted but no bundled seed data was found.');
    return buildResult(false, currentCounts);
  }

  await db.transaction('rw', [db.lessons, db.exercises, db.flashcards, db.settings], async () => {
    if (bundledSeed.lessons.length) await db.lessons.bulkPut(bundledSeed.lessons);
    if (bundledSeed.exercises.length) await db.exercises.bulkPut(bundledSeed.exercises);
    if (bundledSeed.flashcards.length) await db.flashcards.bulkPut(bundledSeed.flashcards);
    await db.settings.put({ key: SEED_VERSION_KEY, value: DEFAULT_SEED_VERSION });
  });

  const seededCounts: SeedCounts = {
    lessons: bundledSeed.lessons.length,
    exercises: bundledSeed.exercises.length,
    flashcards: bundledSeed.flashcards.length,
  };

  return buildResult(true, seededCounts);
}

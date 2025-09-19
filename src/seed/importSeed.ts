import { db } from '../db';
import {
  LessonSchema,
  ExerciseSchema,
  FlashcardSchema,
  SeedBundleSchema,
  type Lesson,
  type Exercise,
  type Flashcard,
  type SeedBundle,
} from './seedTypes';

/**
 * Accepts either:
 *  - a full bundle { lessons, exercises, flashcards }
 *  - or separate arrays for each entity.
 * Validates with Zod and writes to Dexie using bulkPut (upsert).
 */
export async function importSeed(raw: unknown) {
  // Normalize input into a SeedBundle
  let bundle: SeedBundle;
  if (
    raw &&
    typeof raw === 'object' &&
    ('lessons' in (raw as any) ||
      'exercises' in (raw as any) ||
      'flashcards' in (raw as any))
  ) {
    bundle = SeedBundleSchema.parse({
      lessons: (raw as any).lessons ?? [],
      exercises: (raw as any).exercises ?? [],
      flashcards: (raw as any).flashcards ?? [],
    });
  } else if (Array.isArray(raw)) {
    // If an array is passed, try to detect the type by validating samples
    const arr = raw as unknown[];
    const lessons: Lesson[] = [];
    const exercises: Exercise[] = [];
    const flashcards: Flashcard[] = [];
    for (const item of arr) {
      // try each schema; push into the one that passes
      const asLesson = tryParse(LessonSchema, item);
      if (asLesson) {
        lessons.push(asLesson);
        continue;
      }
      const asExercise = tryParse(ExerciseSchema, item);
      if (asExercise) {
        exercises.push(asExercise);
        continue;
      }
      const asFlash = tryParse(FlashcardSchema, item);
      if (asFlash) {
        flashcards.push(asFlash);
        continue;
      }
      console.warn('Skipped unrecognized item during seed import:', item);
    }
    bundle = SeedBundleSchema.parse({ lessons, exercises, flashcards });
  } else {
    // Last chance: try to parse as a single entity
    const lesson = tryParse(LessonSchema, raw);
    const exercise = tryParse(ExerciseSchema, raw);
    const flash = tryParse(FlashcardSchema, raw);
    bundle = SeedBundleSchema.parse({
      lessons: lesson ? [lesson] : [],
      exercises: exercise ? [exercise] : [],
      flashcards: flash ? [flash] : [],
    });
  }

  // Upsert into Dexie
  const [lCount, eCount, fCount] = await Promise.all([
    db.lessons.bulkPut(bundle.lessons).then(() => bundle.lessons.length),
    db.exercises.bulkPut(bundle.exercises).then(() => bundle.exercises.length),
    db.flashcards.bulkPut(bundle.flashcards).then(() => bundle.flashcards.length),
  ]);

  return {
    lessonsImported: lCount,
    exercisesImported: eCount,
    flashcardsImported: fCount,
  };
}

function tryParse<T>(schema: { parse: (v: unknown) => T }, value: unknown): T | null {
  try {
    return schema.parse(value);
  } catch {
    return null;
  }
}

import { ExerciseSchema, FlashcardSchema, LessonSchema, SeedBundleSchema, type Exercise, type Flashcard, type Lesson, type SeedBundle } from './seedTypes';

type NormalizerOptions = {
  onItemSkipped?: (item: unknown) => void;
};

const tryParse = <T>(schema: { parse: (value: unknown) => T }, value: unknown): T | null => {
  try {
    return schema.parse(value);
  } catch {
    return null;
  }
};

const warn = (options: NormalizerOptions | undefined, item: unknown) => {
  options?.onItemSkipped?.(item);
};

export const normalizeSeedInput = (raw: unknown, options?: NormalizerOptions): SeedBundle => {
  if (raw == null) {
    return { lessons: [], exercises: [], flashcards: [] };
  }

  if (Array.isArray(raw)) {
    const lessons: Lesson[] = [];
    const exercises: Exercise[] = [];
    const flashcards: Flashcard[] = [];

    for (const item of raw) {
      const lesson = tryParse(LessonSchema, item);
      if (lesson) {
        lessons.push(lesson);
        continue;
      }
      const exercise = tryParse(ExerciseSchema, item);
      if (exercise) {
        exercises.push(exercise);
        continue;
      }
      const flashcard = tryParse(FlashcardSchema, item);
      if (flashcard) {
        flashcards.push(flashcard);
        continue;
      }
      warn(options, item);
    }

    return SeedBundleSchema.parse({ lessons, exercises, flashcards });
  }

  if (typeof raw === 'object') {
    try {
      return SeedBundleSchema.parse({
        lessons: (raw as { lessons?: unknown }).lessons ?? [],
        exercises: (raw as { exercises?: unknown }).exercises ?? [],
        flashcards: (raw as { flashcards?: unknown }).flashcards ?? [],
      });
    } catch {
      // fall through to try single-entity parsing
    }
  }

  const lesson = tryParse(LessonSchema, raw);
  const exercise = tryParse(ExerciseSchema, raw);
  const flashcard = tryParse(FlashcardSchema, raw);

  if (lesson || exercise || flashcard) {
    return SeedBundleSchema.parse({
      lessons: lesson ? [lesson] : [],
      exercises: exercise ? [exercise] : [],
      flashcards: flashcard ? [flashcard] : [],
    });
  }

  warn(options, raw);
  return { lessons: [], exercises: [], flashcards: [] };
};

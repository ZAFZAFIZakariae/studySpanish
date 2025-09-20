import { db } from '../db';
import { CUSTOM_SEED_MARKER, SEED_VERSION_KEY } from './ensureSeedData';
import { SeedBundleSchema } from './seedTypes';
import { normalizeSeedInput } from './normalizeSeedBundle';

/**
 * Accepts either:
 *  - a full bundle { lessons, exercises, flashcards }
 *  - or separate arrays for each entity.
 * Validates with Zod and writes to Dexie using bulkPut (upsert).
 */
export async function importSeed(raw: unknown) {
  // Normalize input into a SeedBundle
  const bundle = normalizeSeedInput(raw, {
    onItemSkipped: (item) => console.warn('Skipped unrecognized item during seed import:', item),
  });

  SeedBundleSchema.parse(bundle);

  // Upsert into Dexie and mark that a manual import has occurred
  await db.transaction('rw', [db.lessons, db.exercises, db.flashcards, db.settings], async () => {
    if (bundle.lessons.length) await db.lessons.bulkPut(bundle.lessons);
    if (bundle.exercises.length) await db.exercises.bulkPut(bundle.exercises);
    if (bundle.flashcards.length) await db.flashcards.bulkPut(bundle.flashcards);
    await db.settings.put({ key: SEED_VERSION_KEY, value: CUSTOM_SEED_MARKER });
  });

  return {
    lessonsImported: bundle.lessons.length,
    exercisesImported: bundle.exercises.length,
    flashcardsImported: bundle.flashcards.length,
  };
}

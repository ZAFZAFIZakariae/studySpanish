import { db } from './db';
import { LessonSchema, ExerciseSchema, FlashcardSchema } from './lib/schemas';

export const importSeed = async (data: {
  lessons: any[], exercises: any[], flashcards: any[]
}) => {
  const lessons = data.lessons.map(l => LessonSchema.parse(l));
  const exercises = data.exercises.map(e => ExerciseSchema.parse(e));
  const flashcards = data.flashcards.map(f => FlashcardSchema.parse(f));

  await db.lessons.bulkPut(lessons);
  await db.exercises.bulkPut(exercises);
  await db.flashcards.bulkPut(flashcards);
};

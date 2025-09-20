import { z } from 'zod';

export const LessonSchema = z.object({
  id: z.string(),
  level: z.enum(['B1', 'C1']),
  title: z.string(),
  slug: z.string(),
  tags: z.array(z.string()),
  markdown: z.string(),
  references: z.array(z.string()).optional()
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ExerciseSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  type: z.enum(['mcq','multi','cloze','short','translate','conjugate','order','match']),
  promptMd: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string())]),
  accepted: z.array(z.string()).optional(),
  rubric: z.string().optional(),
  feedback: z.object({
    correct: z.string(),
    wrong: z.string(),
    hints: z.array(z.string()).optional()
  }).optional(),
  meta: z.object({
    difficulty: z.enum(['A2','B1','B2','C1']),
    skills: z.array(z.enum(['read','write','listen','speak'])),
    topic: z.string().optional()
  }).optional()
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const GradeSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  userAnswer: z.any(),
  isCorrect: z.boolean(),
  score: z.number(),
  attempts: z.number(),
  timeMs: z.number(),
  gradedAt: z.string(),
  feedbackText: z.string().optional(),
  syncedAt: z.string().optional()
});
export type Grade = z.infer<typeof GradeSchema>;

export const FlashcardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  tag: z.string(),
  deck: z.enum(['grammar','verbs','vocab','presentations']),
  srs: z.object({
    bucket: z.number(),
    lastReview: z.string().optional(),
    nextDue: z.string().optional()
  }).optional()
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const SeedBundleSchema = z.object({
  lessons: z.array(LessonSchema).default([]),
  exercises: z.array(ExerciseSchema).default([]),
  flashcards: z.array(FlashcardSchema).default([]),
});
export type SeedBundle = z.infer<typeof SeedBundleSchema>;

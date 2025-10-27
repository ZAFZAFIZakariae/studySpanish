import { ggoTema1Quiz } from './ggo-tema-1';
import { ggoTema2Quiz } from './ggo-tema-2';
import { ggoTema3Quiz } from './ggo-tema-3';
import { ggoTema4Quiz } from './ggo-tema-4';
import { LessonQuizDefinition } from './types';

const quizzes: Record<string, LessonQuizDefinition> = {
  'ggo-tema-1': ggoTema1Quiz,
  'ggo-tema-2': ggoTema2Quiz,
  'ggo-tema-3': ggoTema3Quiz,
  'ggo-tema-4': ggoTema4Quiz,
};

export const lessonQuizzes = quizzes;

export const getLessonQuiz = (id: string): LessonQuizDefinition | undefined => quizzes[id];

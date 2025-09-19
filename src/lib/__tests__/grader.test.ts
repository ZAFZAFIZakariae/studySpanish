import { gradeAnswer } from '../grader';
import { Exercise } from '../schemas';

type ExerciseInit = Partial<Exercise> & Pick<Exercise, 'type' | 'answer'>;

const createExercise = (init: ExerciseInit): Exercise => ({
  id: init.id ?? 'test-ex',
  lessonId: init.lessonId ?? 'lesson-1',
  type: init.type,
  promptMd: init.promptMd ?? 'prompt',
  answer: init.answer,
  options: init.options,
  accepted: init.accepted,
  rubric: init.rubric,
  feedback: init.feedback,
  meta: init.meta
});

describe('gradeAnswer normalization and diacritics', () => {
  it('removes accent marks but keeps ñ distinct', () => {
    const accentExercise = createExercise({ type: 'cloze', answer: 'canción' });
    expect(gradeAnswer(accentExercise, 'cancion').isCorrect).toBe(true);

    const enyeExercise = createExercise({ type: 'cloze', answer: 'año' });
    expect(gradeAnswer(enyeExercise, 'ano').isCorrect).toBe(false);
  });

  it('matches accepted regex with accent stripping', () => {
    const exercise = createExercise({
      type: 'short',
      answer: 'vivís',
      accepted: ['re:^vivís$']
    });

    expect(gradeAnswer(exercise, 'vivis').isCorrect).toBe(true);
  });
});

describe('Levenshtein threshold logic', () => {
  it('allows one typo for short responses', () => {
    const exercise = createExercise({ type: 'short', answer: 'hablar' });
    expect(gradeAnswer(exercise, 'hablr').isCorrect).toBe(true);
    expect(gradeAnswer(exercise, 'hbalr').isCorrect).toBe(false);
  });

  it('allows up to two edits for longer responses', () => {
    const exercise = createExercise({ type: 'short', answer: 'estudiando' });
    expect(gradeAnswer(exercise, 'estudianod').isCorrect).toBe(true);
    expect(gradeAnswer(exercise, 'estudinadozz').isCorrect).toBe(false);
  });
});

describe('MCQ and multi-select grading', () => {
  it('grades a single-choice MCQ accurately', () => {
    const exercise = createExercise({
      type: 'mcq',
      answer: 'azul',
      options: ['rojo', 'azul', 'verde']
    });
    const result = gradeAnswer(exercise, 'Azul');
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it('requires all correct options and penalises extras for multi-select', () => {
    const exercise = createExercise({
      type: 'multi',
      answer: ['rojo', 'azul'],
      options: ['rojo', 'azul', 'verde', 'amarillo']
    });

    const perfect = gradeAnswer(exercise, ['azul', 'rojo']);
    expect(perfect.isCorrect).toBe(true);
    expect(perfect.score).toBe(100);

    const withExtra = gradeAnswer(exercise, ['azul', 'rojo', 'verde']);
    expect(withExtra.isCorrect).toBe(false);
    expect(withExtra.score).toBeCloseTo(66.67, 2);
  });
});

describe('Conjugation table scoring', () => {
  it('scores each conjugation cell independently', () => {
    const exercise = createExercise({
      type: 'conjugate',
      answer: ['hablo', 'hablas', 'habla']
    });

    const result = gradeAnswer(exercise, ['hablo', 'hablas', 'hablamos']);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBeCloseTo(66.67, 2);
  });
});

describe('Translation grading with accepted regex keywords', () => {
  it('requires all keyword patterns to match', () => {
    const exercise = createExercise({
      type: 'translate',
      answer: 'It was sunny and the birds were singing',
      accepted: ['re:was sunny', 're:were singing']
    });

    const success = gradeAnswer(exercise, 'It was sunny while the birds were singing loudly.');
    expect(success.isCorrect).toBe(true);

    const missingKeyword = gradeAnswer(exercise, 'It was sunny outside all day.');
    expect(missingKeyword.isCorrect).toBe(false);
  });

  it('supports anchored alternative patterns', () => {
    const exercise = createExercise({
      type: 'short',
      answer: 'quise llamarte',
      accepted: ['re:^quise llamarte$', 're:^quise llamarte\\.$']
    });

    expect(gradeAnswer(exercise, 'Quise llamarte.').isCorrect).toBe(true);
  });
});

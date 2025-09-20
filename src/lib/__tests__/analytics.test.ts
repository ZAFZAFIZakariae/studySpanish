import { computeAnalytics } from '../analytics';
import { Exercise, Flashcard, Grade, Lesson } from '../schemas';

describe('computeAnalytics', () => {
  const lessons: Lesson[] = [
    {
      id: 'lesson-1',
      level: 'B1',
      title: 'Subjunctive drill',
      slug: 'subjunctive-drill',
      tags: ['subjunctive', 'verbs'],
      markdown: '# Subjunctive',
      references: [],
    },
    {
      id: 'lesson-2',
      level: 'C1',
      title: 'Presentation polish',
      slug: 'presentation-polish',
      tags: ['presentation'],
      markdown: '# Presentations',
      references: [],
    },
  ];

  const exercises: Exercise[] = [
    {
      id: 'ex-1',
      lessonId: 'lesson-1',
      type: 'translate',
      promptMd: 'Traduce **hola**',
      answer: 'hola',
      meta: { difficulty: 'B1', skills: ['write', 'speak'] },
    },
    {
      id: 'ex-2',
      lessonId: 'lesson-1',
      type: 'translate',
      promptMd: 'Traduce **adiós**',
      answer: 'adiós',
      meta: { difficulty: 'B2', skills: ['write', 'speak'] },
    },
    {
      id: 'ex-3',
      lessonId: 'lesson-2',
      type: 'short',
      promptMd: 'Escribe una frase de cierre impactante.',
      answer: 'Cierre',
      meta: { difficulty: 'C1', skills: ['speak'] },
    },
  ];

  const baseDate = new Date('2024-06-10T12:00:00.000Z');
  const daysAgo = (offset: number) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - offset);
    return date.toISOString();
  };

  const grades: Grade[] = [
    {
      id: 'grade-1',
      exerciseId: 'ex-1',
      userAnswer: 'hola',
      isCorrect: true,
      score: 100,
      attempts: 1,
      timeMs: 12000,
      gradedAt: daysAgo(0),
    },
    {
      id: 'grade-2',
      exerciseId: 'ex-2',
      userAnswer: 'adios',
      isCorrect: false,
      score: 40,
      attempts: 1,
      timeMs: 15000,
      gradedAt: daysAgo(1),
    },
    {
      id: 'grade-3',
      exerciseId: 'ex-2',
      userAnswer: 'adiós',
      isCorrect: true,
      score: 90,
      attempts: 2,
      timeMs: 20000,
      gradedAt: daysAgo(0),
    },
    {
      id: 'grade-4',
      exerciseId: 'ex-3',
      userAnswer: 'Cerrar',
      isCorrect: false,
      score: 60,
      attempts: 1,
      timeMs: 10000,
      gradedAt: daysAgo(2),
    },
  ];

  const flashcards: Flashcard[] = [
    {
      id: 'card-1',
      front: 'ser',
      back: 'to be',
      tag: 'verbs',
      deck: 'verbs',
      srs: {
        bucket: 1,
        lastReview: daysAgo(1),
        nextDue: daysAgo(0),
        streak: 2,
        lastGrade: 'good',
      },
    },
    {
      id: 'card-2',
      front: 'aunque',
      back: 'although',
      tag: 'connectors',
      deck: 'grammar',
      srs: {
        bucket: 3,
        lastReview: daysAgo(2),
        nextDue: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        streak: 3,
        lastGrade: 'easy',
      },
    },
    {
      id: 'card-3',
      front: 'pitch',
      back: 'presentación',
      tag: 'presentation',
      deck: 'presentations',
    },
  ];

  it('computes streaks, mastery, and SRS summaries', () => {
    const snapshot = computeAnalytics(lessons, exercises, grades, flashcards);

    expect(snapshot.lessonMastery.length).toBe(2);
    const lesson = snapshot.lessonMastery.find((entry) => entry.lessonId === 'lesson-1');
    expect(lesson).toBeDefined();
    expect(lesson?.masteredExercises).toBe(2);
    expect(lesson?.attemptedExercises).toBe(2);

    expect(snapshot.skillAccuracy.find((entry) => entry.skill === 'speak')?.total).toBe(4);
    expect(snapshot.studyPlan.some((entry) => entry.exerciseId === 'ex-3')).toBe(true);

    expect(snapshot.streak.best).toBeGreaterThanOrEqual(3);
    expect(snapshot.activityTrend).toHaveLength(14);

    expect(snapshot.srs.dueNow).toBeGreaterThanOrEqual(2);
    const verbsDeck = snapshot.srs.deckBreakdown.find((entry) => entry.deck === 'verbs');
    expect(verbsDeck).toBeDefined();
    expect(verbsDeck?.total).toBe(1);
    expect((verbsDeck?.due ?? 0)).toBeGreaterThanOrEqual(1);
    expect(snapshot.srs.bucketBreakdown.length).toBeGreaterThan(0);
  });
});

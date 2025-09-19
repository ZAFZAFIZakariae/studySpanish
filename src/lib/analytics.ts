import { Exercise, Grade, Lesson } from './schemas';

export interface LessonTimeStat {
  lessonId: string;
  lessonTitle: string;
  totalMs: number;
}

export interface TagWeakness {
  tag: string;
  accuracy: number;
  correct: number;
  total: number;
}

export interface StudyRecommendation {
  exerciseId: string;
  lessonId: string;
  lessonTitle: string;
  prompt: string;
  reason: string;
  priority: number;
}

export interface AnalyticsSnapshot {
  lessonTimes: LessonTimeStat[];
  averageAttemptsToMastery: number;
  weakestTags: TagWeakness[];
  studyPlan: StudyRecommendation[];
}

const byDate = (a: Grade, b: Grade) =>
  new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime();

export const computeAnalytics = (
  lessons: Lesson[],
  exercises: Exercise[],
  grades: Grade[]
): AnalyticsSnapshot => {
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  const gradesByExercise = new Map<string, Grade[]>();
  grades.forEach((grade) => {
    const list = gradesByExercise.get(grade.exerciseId) ?? [];
    list.push(grade);
    gradesByExercise.set(grade.exerciseId, list);
  });
  gradesByExercise.forEach((list) => list.sort(byDate));

  const lessonTimeMap = new Map<string, number>();
  grades.forEach((grade) => {
    const exercise = exerciseById.get(grade.exerciseId);
    if (!exercise) return;
    const current = lessonTimeMap.get(exercise.lessonId) ?? 0;
    lessonTimeMap.set(exercise.lessonId, current + (grade.timeMs ?? 0));
  });
  const lessonTimes: LessonTimeStat[] = Array.from(lessonTimeMap.entries())
    .map(([lessonId, totalMs]) => ({
      lessonId,
      lessonTitle: lessonById.get(lessonId)?.title ?? lessonId,
      totalMs,
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  const masteryAttempts: number[] = [];
  gradesByExercise.forEach((list) => {
    let attempts = 0;
    for (const grade of list) {
      attempts += grade.attempts ?? 1;
      if (grade.isCorrect) {
        masteryAttempts.push(attempts);
        break;
      }
    }
  });
  const averageAttemptsToMastery = masteryAttempts.length
    ? masteryAttempts.reduce((sum, value) => sum + value, 0) / masteryAttempts.length
    : 0;

  const tagStats = new Map<string, { correct: number; total: number }>();
  grades.forEach((grade) => {
    const exercise = exerciseById.get(grade.exerciseId);
    if (!exercise) return;
    const lesson = lessonById.get(exercise.lessonId);
    if (!lesson) return;
    lesson.tags.forEach((tag) => {
      const stats = tagStats.get(tag) ?? { correct: 0, total: 0 };
      stats.total += 1;
      if (grade.isCorrect) stats.correct += 1;
      tagStats.set(tag, stats);
    });
  });
  const weakestTags: TagWeakness[] = Array.from(tagStats.entries())
    .map(([tag, stats]) => ({
      tag,
      accuracy: stats.total ? (stats.correct / stats.total) * 100 : 0,
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, 5);

  const studyPlan: StudyRecommendation[] = [];
  const planned = new Set<string>();

  exercises.forEach((exercise) => {
    if (gradesByExercise.has(exercise.id)) return;
    const lesson = lessonById.get(exercise.lessonId);
    studyPlan.push({
      exerciseId: exercise.id,
      lessonId: exercise.lessonId,
      lessonTitle: lesson?.title ?? exercise.lessonId,
      prompt: exercise.promptMd,
      reason: 'Not attempted yet',
      priority: 0,
    });
    planned.add(exercise.id);
  });

  const strugglingExercises = exercises
    .map((exercise) => {
      const history = gradesByExercise.get(exercise.id);
      if (!history || history.length === 0) return null;
      const lesson = lessonById.get(exercise.lessonId);
      const correctCount = history.filter((grade) => grade.isCorrect).length;
      const accuracy = (correctCount / history.length) * 100;
      const lastGrade = history[history.length - 1];
      const priority = lastGrade.isCorrect ? 2 : 1;
      const reason = lastGrade.isCorrect
        ? `Mastered (${accuracy.toFixed(0)}% accuracy)`
        : `Last score ${lastGrade.score.toFixed(0)}%`;
      return {
        exercise,
        lesson,
        priority,
        reason,
        accuracy,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => a.priority - b.priority || a.accuracy - b.accuracy);

  strugglingExercises.forEach((entry) => {
    if (planned.has(entry.exercise.id)) return;
    studyPlan.push({
      exerciseId: entry.exercise.id,
      lessonId: entry.exercise.lessonId,
      lessonTitle: entry.lesson?.title ?? entry.exercise.lessonId,
      prompt: entry.exercise.promptMd,
      reason: entry.reason,
      priority: entry.priority,
    });
    planned.add(entry.exercise.id);
  });

  studyPlan.sort((a, b) => a.priority - b.priority || a.lessonTitle.localeCompare(b.lessonTitle));

  return {
    lessonTimes,
    averageAttemptsToMastery,
    weakestTags,
    studyPlan: studyPlan.slice(0, 5),
  };
};

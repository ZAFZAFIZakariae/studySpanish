import { Exercise, Flashcard, Grade, Lesson } from './schemas';
import { isDue, summarizeBuckets } from './srs';

export interface LessonTimeStat {
  lessonId: string;
  lessonTitle: string;
  totalMs: number;
}

export interface LessonMasteryStat {
  lessonId: string;
  lessonTitle: string;
  lessonSlug?: string;
  totalExercises: number;
  attemptedExercises: number;
  masteredExercises: number;
  accuracy: number;
  lastAttemptAt?: string;
}

export interface TagWeakness {
  tag: string;
  accuracy: number;
  correct: number;
  total: number;
}

export interface SkillAccuracy {
  skill: string;
  accuracy: number;
  correct: number;
  total: number;
}

export interface StudyRecommendation {
  exerciseId: string;
  lessonId: string;
  lessonSlug?: string;
  lessonTitle: string;
  prompt: string;
  reason: string;
  priority: number;
}

export interface StudyActivityPoint {
  date: string;
  total: number;
  correct: number;
}

export interface StudyStreak {
  current: number;
  best: number;
  lastStudiedOn?: string;
}

export interface SRSSummaryEntry {
  label: string;
  count: number;
}

export interface SRSDashboardSummary {
  dueNow: number;
  upcoming: SRSSummaryEntry[];
  bucketBreakdown: ReturnType<typeof summarizeBuckets>;
  deckBreakdown: { deck: Flashcard['deck']; due: number; total: number }[];
}

export interface AnalyticsSnapshot {
  lessonTimes: LessonTimeStat[];
  lessonMastery: LessonMasteryStat[];
  averageAttemptsToMastery: number;
  weakestTags: TagWeakness[];
  skillAccuracy: SkillAccuracy[];
  studyPlan: StudyRecommendation[];
  activityTrend: StudyActivityPoint[];
  streak: StudyStreak;
  srs: SRSDashboardSummary;
}

const byDateAsc = (a: Grade, b: Grade) =>
  new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime();

const dayKey = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const differenceInDays = (a: Date, b: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
};

export const computeAnalytics = (
  lessons: Lesson[],
  exercises: Exercise[],
  grades: Grade[],
  flashcards: Flashcard[] = []
): AnalyticsSnapshot => {
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const exercisesByLesson = new Map<string, Exercise[]>();
  exercises.forEach((exercise) => {
    const list = exercisesByLesson.get(exercise.lessonId) ?? [];
    list.push(exercise);
    exercisesByLesson.set(exercise.lessonId, list);
  });
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  const gradesByExercise = new Map<string, Grade[]>();
  grades.forEach((grade) => {
    const list = gradesByExercise.get(grade.exerciseId) ?? [];
    list.push(grade);
    gradesByExercise.set(grade.exerciseId, list);
  });
  gradesByExercise.forEach((list) => list.sort(byDateAsc));

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
      lessonSlug: lesson?.slug,
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
      lessonSlug: entry.lesson?.slug,
      lessonTitle: entry.lesson?.title ?? entry.exercise.lessonId,
      prompt: entry.exercise.promptMd,
      reason: entry.reason,
      priority: entry.priority,
    });
    planned.add(entry.exercise.id);
  });

  studyPlan.sort((a, b) => a.priority - b.priority || a.lessonTitle.localeCompare(b.lessonTitle));

  const lessonMastery: LessonMasteryStat[] = lessons.map((lesson) => {
    const lessonExercises = exercisesByLesson.get(lesson.id) ?? [];
    let attemptedExercises = 0;
    let masteredExercises = 0;
    let correct = 0;
    let total = 0;
    let lastAttemptAt: string | undefined;

    lessonExercises.forEach((exercise) => {
      const history = gradesByExercise.get(exercise.id) ?? [];
      if (history.length > 0) {
        attemptedExercises += 1;
        const last = history[history.length - 1];
        if (!lastAttemptAt || new Date(last.gradedAt) > new Date(lastAttemptAt)) {
          lastAttemptAt = last.gradedAt;
        }
        if (last.isCorrect) masteredExercises += 1;
        correct += history.filter((grade) => grade.isCorrect).length;
        total += history.length;
      }
    });

    const accuracy = total ? (correct / total) * 100 : 0;

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonSlug: lesson.slug,
      totalExercises: lessonExercises.length,
      attemptedExercises,
      masteredExercises,
      accuracy,
      lastAttemptAt,
    };
  });

  const skillStats = new Map<string, { correct: number; total: number }>();
  grades.forEach((grade) => {
    const exercise = exerciseById.get(grade.exerciseId);
    if (!exercise) return;
    const skills = exercise.meta?.skills?.length ? exercise.meta.skills : ['read'];
    skills.forEach((skill) => {
      const stats = skillStats.get(skill) ?? { correct: 0, total: 0 };
      stats.total += 1;
      if (grade.isCorrect) stats.correct += 1;
      skillStats.set(skill, stats);
    });
  });
  const skillAccuracy: SkillAccuracy[] = Array.from(skillStats.entries())
    .map(([skill, stats]) => ({
      skill,
      accuracy: stats.total ? (stats.correct / stats.total) * 100 : 0,
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const activityByDay = new Map<string, { total: number; correct: number }>();
  grades.forEach((grade) => {
    const key = dayKey(grade.gradedAt);
    const entry = activityByDay.get(key) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (grade.isCorrect) entry.correct += 1;
    activityByDay.set(key, entry);
  });

  const activityTrend: StudyActivityPoint[] = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = dayKey(date);
    const entry = activityByDay.get(key) ?? { total: 0, correct: 0 };
    activityTrend.push({ date: key, total: entry.total, correct: entry.correct });
  }

  const uniqueDays = Array.from(activityByDay.keys()).sort();
  let bestStreak = 0;
  let running = 0;
  let previous: Date | null = null;
  uniqueDays.forEach((day) => {
    const current = new Date(day);
    if (!previous) {
      running = 1;
    } else {
      const diff = differenceInDays(current, previous);
      running = diff === 1 ? running + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, running);
    previous = current;
  });

  const sortedDesc = [...uniqueDays].sort((a, b) => (a < b ? 1 : -1));
  let currentStreak = 0;
  let lastStudiedOn: string | undefined;
  let cursor: Date | null = null;
  const today = new Date();
  sortedDesc.forEach((day) => {
    const current = new Date(day);
    if (currentStreak === 0) {
      const diff = Math.abs(differenceInDays(today, current));
      if (diff <= 1) {
        currentStreak = 1;
        cursor = current;
        lastStudiedOn = day;
      } else {
        return;
      }
    } else if (cursor) {
      const diff = differenceInDays(cursor, current);
      if (diff === 1) {
        currentStreak += 1;
        cursor = current;
        lastStudiedOn = day;
      }
    }
  });

  const dueNow = flashcards.filter(isDue).length;
  const upcomingBuckets: SRSSummaryEntry[] = [
    { label: 'Due tomorrow', count: 0 },
    { label: 'Due in 3 days', count: 0 },
    { label: 'Due in 7 days', count: 0 },
  ];
  const deckMap = new Map<Flashcard['deck'], { due: number; total: number }>();
  flashcards.forEach((card) => {
    const deck = deckMap.get(card.deck) ?? { due: 0, total: 0 };
    deck.total += 1;
    if (isDue(card)) deck.due += 1;
    else if (card.srs?.nextDue) {
      const diff = differenceInDays(new Date(card.srs.nextDue), new Date());
      if (diff === 1) upcomingBuckets[0].count += 1;
      else if (diff > 1 && diff <= 3) upcomingBuckets[1].count += 1;
      else if (diff > 3 && diff <= 7) upcomingBuckets[2].count += 1;
    }
    deckMap.set(card.deck, deck);
  });

  const srs: SRSDashboardSummary = {
    dueNow,
    upcoming: upcomingBuckets.filter((entry) => entry.count > 0),
    bucketBreakdown: summarizeBuckets(flashcards),
    deckBreakdown: Array.from(deckMap.entries())
      .map(([deck, stats]) => ({ deck, ...stats }))
      .sort((a, b) => b.due - a.due || b.total - a.total),
  };

  return {
    lessonTimes,
    lessonMastery: lessonMastery.sort((a, b) => (b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0) - (a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0)),
    averageAttemptsToMastery,
    weakestTags,
    skillAccuracy,
    studyPlan: studyPlan.slice(0, 5),
    activityTrend,
    streak: {
      current: currentStreak,
      best: bestStreak,
      lastStudiedOn,
    },
    srs,
  };
};

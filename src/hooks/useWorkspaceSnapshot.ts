import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db';
import { computeAnalytics, StudyRecommendation, StudyStreak, SRSDashboardSummary } from '../lib/analytics';
import { Lesson } from '../lib/schemas';

export interface ResumeLesson {
  lessonId: string;
  lessonSlug?: string;
  lessonTitle: string;
  lastAttemptAt?: string;
  masteredCount: number;
  totalExercises: number;
}

export interface WorkspaceSnapshot {
  loading: boolean;
  lessons: Lesson[];
  resumeLesson?: ResumeLesson;
  dueFlashcards: number;
  deckDue: { deck: string; due: number; total: number }[];
  weakestTag?: { tag: string; accuracy: number };
  studyPlan: StudyRecommendation[];
  streak: StudyStreak;
  lastStudiedOn?: string;
  milestone?: MilestoneCelebration;
}

const initialState: WorkspaceSnapshot = {
  loading: true,
  lessons: [],
  dueFlashcards: 0,
  deckDue: [],
  studyPlan: [],
  streak: { current: 0, best: 0 },
};

export interface MilestoneCelebration {
  title: string;
  subtitle: string;
  badge: string;
}

const determineMilestone = (
  analytics: ReturnType<typeof computeAnalytics>,
  progressPercent: number,
  srs: SRSDashboardSummary
): MilestoneCelebration | undefined => {
  if (analytics.streak.current >= 7 && analytics.streak.current % 7 === 0) {
    return {
      title: `Streak hero: ${analytics.streak.current} days!`,
      subtitle: 'Consistency unlocks comprehension. Celebrate your dedication.',
      badge: `${analytics.streak.current}d streak`,
    };
  }
  if (progressPercent >= 75) {
    return {
      title: 'Mastery milestone unlocked',
      subtitle: `You have mastered ${progressPercent.toFixed(0)}% of tracked exercises. Time to celebrate!`,
      badge: 'Mastery 75%',
    };
  }
  if (srs.dueNow === 0 && progressPercent > 0) {
    return {
      title: 'Deck zeroed out',
      subtitle: 'All flashcards cleared — perfect moment for a cultural bonus.',
      badge: 'SRS clean sweep',
    };
  }
  return undefined;
};

export const useWorkspaceSnapshot = () => {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(initialState);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [lessons, exercises, grades, flashcards] = await Promise.all([
        db.lessons.toArray(),
        db.exercises.toArray(),
        db.grades.toArray(),
        db.flashcards.toArray(),
      ]);
      return { lessons, exercises, grades, flashcards };
    }).subscribe({
      next: ({ lessons, exercises, grades, flashcards }) => {
        const analytics = computeAnalytics(lessons, exercises, grades, flashcards);

        const resumeLessonEntry = analytics.lessonMastery.find((entry) => Boolean(entry.lastAttemptAt));

        const resumeLesson = resumeLessonEntry
          ? {
              lessonId: resumeLessonEntry.lessonId,
              lessonSlug: resumeLessonEntry.lessonSlug,
              lessonTitle: resumeLessonEntry.lessonTitle,
              lastAttemptAt: resumeLessonEntry.lastAttemptAt,
              masteredCount: resumeLessonEntry.masteredExercises,
              totalExercises: resumeLessonEntry.totalExercises,
            }
          : undefined;

        const weakestTag = analytics.weakestTags[0]
          ? { tag: analytics.weakestTags[0].tag, accuracy: analytics.weakestTags[0].accuracy }
          : undefined;

        const totals = analytics.lessonMastery.reduce(
          (acc, entry) => {
            acc.mastered += entry.masteredExercises;
            acc.total += entry.totalExercises;
            return acc;
          },
          { mastered: 0, total: 0 }
        );
        const progressPercent = totals.total ? (totals.mastered / totals.total) * 100 : 0;
        const milestone = determineMilestone(analytics, progressPercent, analytics.srs);

        setSnapshot({
          loading: false,
          lessons,
          resumeLesson,
          dueFlashcards: analytics.srs.dueNow,
          deckDue: analytics.srs.deckBreakdown,
          weakestTag,
          studyPlan: analytics.studyPlan,
          streak: analytics.streak,
          lastStudiedOn: analytics.streak.lastStudiedOn,
          milestone,
        });
      },
      error: (error) => {
        console.error('Failed to load workspace snapshot', error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return snapshot;
};

import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db';
import { computeAnalytics, StudyRecommendation } from '../lib/analytics';
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
}

const initialState: WorkspaceSnapshot = {
  loading: true,
  lessons: [],
  dueFlashcards: 0,
  deckDue: [],
  studyPlan: [],
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

        setSnapshot({
          loading: false,
          lessons,
          resumeLesson,
          dueFlashcards: analytics.srs.dueNow,
          deckDue: analytics.srs.deckBreakdown,
          weakestTag,
          studyPlan: analytics.studyPlan,
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

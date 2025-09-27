import { useCallback, useEffect, useMemo, useState } from 'react';
import { To } from 'react-router-dom';
import { useWorkspaceSnapshot } from './useWorkspaceSnapshot';
import { db } from '../db';
import { PlannerQuickAction, PlannerTimelineCard } from '../types/planner';
import { deckLabel, formatRelativeTime } from '../lib/plannerUtils';

const STORAGE_KEY = 'planner-goals';

export type PlannerGoal = {
  id: PlannerTimelineCard['id'];
  note: string;
  scheduledFor?: string | null;
  reminder?: string | null;
};

type GoalMap = Record<PlannerTimelineCard['id'], PlannerGoal | undefined>;

const defaultGoalMap: GoalMap = {
  yesterday: undefined,
  today: undefined,
  tomorrow: undefined,
};

const plannerAnchor: To = { pathname: '/', hash: '#lesson-library' };

const loadStoredGoals = async (): Promise<GoalMap> => {
  try {
    const record = await db.settings.get(STORAGE_KEY);
    if (!record?.value) return defaultGoalMap;
    const value = record.value as GoalMap;
    return {
      yesterday: value.yesterday,
      today: value.today,
      tomorrow: value.tomorrow,
    };
  } catch (error) {
    console.warn('Unable to load planner goals', error);
    return defaultGoalMap;
  }
};

const persistGoals = async (goals: GoalMap) => {
  try {
    await db.settings.put({ key: STORAGE_KEY, value: goals });
  } catch (error) {
    console.warn('Unable to persist planner goals', error);
  }
};

export const usePlannerActions = () => {
  const workspace = useWorkspaceSnapshot();
  const [goalMap, setGoalMap] = useState<GoalMap>(defaultGoalMap);

  useEffect(() => {
    let mounted = true;
    loadStoredGoals().then((goals) => {
      if (mounted) {
        setGoalMap(goals);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateGoal = useCallback((goal: PlannerGoal | undefined) => {
    if (!goal) return;
    setGoalMap((prev) => {
      const next: GoalMap = {
        ...prev,
        [goal.id]: goal.note || goal.scheduledFor || goal.reminder ? goal : undefined,
      };
      persistGoals(next);
      return next;
    });
  }, []);

  const clearGoal = useCallback((id: PlannerTimelineCard['id']) => {
    setGoalMap((prev) => {
      const next: GoalMap = { ...prev, [id]: undefined };
      persistGoals(next);
      return next;
    });
  }, []);

  const commandItems: PlannerQuickAction[] = useMemo(() => {
    if (workspace.loading) {
      return [
        {
          key: 'loading',
          label: 'Syncing your workspace…',
          hint: 'We’re gathering lessons, flashcards and analytics.',
          icon: '⏳',
          disabled: true,
        },
      ];
    }

    const items: PlannerQuickAction[] = [];

    if (workspace.resumeLesson) {
      items.push({
        key: 'resume',
        to: workspace.resumeLesson.lessonSlug
          ? `/lessons/${workspace.resumeLesson.lessonSlug}`
          : plannerAnchor,
        label: `Resume ${workspace.resumeLesson.lessonTitle}`,
        hint: workspace.resumeLesson.lastAttemptAt
          ? `Last review ${formatRelativeTime(workspace.resumeLesson.lastAttemptAt)}`
          : 'Pick up right where you left off.',
        icon: '🎯',
        badge: `${workspace.resumeLesson.masteredCount}/${workspace.resumeLesson.totalExercises}`,
      });
    }

    if (workspace.studyPlan[0]) {
      const next = workspace.studyPlan[0];
      if (!workspace.resumeLesson || workspace.resumeLesson.lessonId !== next.lessonId) {
        items.push({
          key: 'plan',
          to: next.lessonSlug ? `/lessons/${next.lessonSlug}` : plannerAnchor,
          label: `Start ${next.lessonTitle}`,
          hint: next.reason,
          icon: '🗂️',
        });
      }
    }

    const dueDeck = workspace.deckDue.find((entry) => entry.due > 0);
    items.push({
      key: 'flashcards',
      to: '/flashcards',
      label: dueDeck ? `Review ${deckLabel(dueDeck.deck)}` : 'Flashcard sprint',
      hint: dueDeck
        ? `${dueDeck.due} card${dueDeck.due === 1 ? '' : 's'} due now`
        : 'All caught up — run a freestyle warm-up.',
      icon: '🧠',
      badge: workspace.dueFlashcards ? `${workspace.dueFlashcards}` : undefined,
    });

    if (workspace.weakestTag) {
      items.push({
        key: 'weakest-tag',
        to: `/dashboard?focus=${encodeURIComponent(workspace.weakestTag.tag)}`,
        label: `Boost ${workspace.weakestTag.tag}`,
        hint: `${workspace.weakestTag.accuracy.toFixed(0)}% accuracy`,
        icon: '🎯',
      });
    }

    const celebration = workspace.milestone;
    if (celebration) {
      items.unshift({
        key: 'milestone',
        to: '/dashboard',
        label: celebration.title,
        hint: celebration.subtitle,
        icon: '🏅',
        badge: celebration.badge,
      });
    }

    return items.slice(0, 3);
  }, [workspace]);

  const timelineCards: PlannerTimelineCard[] = useMemo(() => {
    const lastStudiedOn = workspace.resumeLesson?.lastAttemptAt ?? workspace.lastStudiedOn;
    const primaryRecommendation = workspace.studyPlan[0];
    const primaryDeck = workspace.deckDue.find((entry) => entry.due > 0);
    return [
      {
        id: 'yesterday',
        label: 'Yesterday',
        title: workspace.streak.current > 0 ? `Streak day ${workspace.streak.current}` : 'Restart your streak',
        description: lastStudiedOn
          ? `Last session ${formatRelativeTime(lastStudiedOn)}`
          : 'No activity logged yet — today is a great day to begin.',
        actionTo: workspace.streak.current > 0 ? '/dashboard' : plannerAnchor,
        actionLabel: workspace.streak.current > 0 ? 'View insights' : 'Plan a session',
        goal: goalMap.yesterday,
      },
      {
        id: 'today',
        label: 'Today',
        title: primaryRecommendation ? primaryRecommendation.lessonTitle : 'Choose your focus',
        description: primaryRecommendation
          ? primaryRecommendation.reason
          : 'Pick a focus block below to jump into practice.',
        actionTo: primaryRecommendation?.lessonSlug ? `/lessons/${primaryRecommendation.lessonSlug}` : plannerAnchor,
        actionLabel: primaryRecommendation ? 'Resume lesson' : 'Browse lessons',
        goal: goalMap.today,
      },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        title: primaryDeck ? `${deckLabel(primaryDeck.deck)} deck` : 'Schedule a review',
        description: primaryDeck
          ? `${primaryDeck.due} due · ${primaryDeck.total} total`
          : 'Stay ahead by pencilling in a short flashcard sprint.',
        actionTo: '/flashcards',
        actionLabel: 'Open flashcards',
        goal: goalMap.tomorrow,
      },
    ];
  }, [goalMap, workspace]);

  return {
    commandItems,
    timelineCards,
    plannerAnchor,
    goalMap,
    updateGoal,
    clearGoal,
    workspace,
  };
};

export type PlannerActionsHook = ReturnType<typeof usePlannerActions>;

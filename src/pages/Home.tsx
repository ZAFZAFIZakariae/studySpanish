import React, { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { liveQuery } from 'dexie';
import { db } from '../db';
import { Lesson } from '../lib/schemas';
import { computeAnalytics } from '../lib/analytics';
import { describeDueStatus, isDue } from '../lib/srs';
import { usePlannerActions } from '../hooks/usePlannerActions';
import { deckLabel as describeDeck } from '../lib/plannerUtils';
import styles from './Home.module.css';

interface LibraryStats {
  totalLessons: number;
  totalExercises: number;
  dueCards: number;
  progress: number;
  streak: number;
  bestStreak: number;
}

interface LessonLibraryItem {
  lesson: Lesson;
  exerciseCount: number;
  masteredCount: number;
  attemptedCount: number;
  accuracy: number;
  lastAttemptAt?: string;
  recommendation?: string;
  recommendationPriority?: number;
}

interface RecommendationCard {
  lessonId: string;
  lessonSlug?: string;
  title: string;
  reason: string;
  priority: number;
}

type TimelineId = 'yesterday' | 'today' | 'tomorrow';

const levelCopy: Record<string, { title: string; description: string }> = {
  A1: {
    title: 'Level A1 · Essentials',
    description: 'Get comfortable with greetings, core verbs, and everyday basics.',
  },
  A2: {
    title: 'Level A2 · Daily exchanges',
    description: 'Practise small talk, preferences, and simple descriptions.',
  },
  B1: {
    title: 'Level B1 · Confident flow',
    description: 'Work on narration, grammar refreshers, and longer chats.',
  },
  B2: {
    title: 'Level B2 · Persuade and react',
    description: 'Debate, explain opinions, and handle nuance.',
  },
  C1: {
    title: 'Level C1 · Professional polish',
    description: 'Fine-tune presentations, tone, and advanced vocabulary.',
  },
  C2: {
    title: 'Level C2 · Nuance mastery',
    description: 'Refine idioms and stylistic control for any audience.',
  },
};

const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type CollectionMatcher = (lesson: Lesson) => boolean;

interface CollectionOption {
  value: string;
  label: string;
  description: string;
  matcher: CollectionMatcher;
}

const createTagMatcher = (tags: string[], mode: 'any' | 'all' = 'any'): CollectionMatcher => {
  const normalized = tags.map((tag) => tag.toLowerCase());
  return (lesson) => {
    if (normalized.length === 0) return true;
    const tagSet = new Set(lesson.tags.map((tag) => tag.toLowerCase()));
    if (mode === 'all') {
      return normalized.every((tag) => tagSet.has(tag));
    }
    return normalized.some((tag) => tagSet.has(tag));
  };
};

const collectionOptions: CollectionOption[] = [
  {
    value: 'all',
    label: 'All lessons',
    description: 'Browse the complete imported library.',
    matcher: createTagMatcher([]),
  },
  {
    value: 'grammar',
    label: 'Grammar focus',
    description: 'Everything tagged as grammar drills and theory.',
    matcher: createTagMatcher(['grammar']),
  },
  {
    value: 'conjugation',
    label: 'Conjugation labs',
    description: 'Verb charts, templates, and conjugation workouts.',
    matcher: createTagMatcher(['conjugation']),
  },
  {
    value: 'verbs',
    label: 'Verb workouts',
    description: 'Lessons centred on verb nuance and irregular stems.',
    matcher: createTagMatcher(['verbs', 'irregulars', 'irregular']),
  },
  {
    value: 'pronouns',
    label: 'Pronoun clinic',
    description: 'Object pronouns, clitics, and reflexive fine-tuning.',
    matcher: createTagMatcher(['pronouns', 'clitics', 'se']),
  },
  {
    value: 'discourse',
    label: 'Connectors & discourse',
    description: 'Register, pragmatics, and discourse connectors.',
    matcher: createTagMatcher(['connectors', 'register', 'pragmatics']),
  },
  {
    value: 'articles',
    label: 'Articles & determiners',
    description: 'Precision drills for articles and determiners.',
    matcher: createTagMatcher(['articles', 'determiners']),
  },
];

const formatLibraryRelativeTime = (value?: string) => {
  if (!value) return 'Unseen';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Scheduled';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
};

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<LessonLibraryItem[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalLessons: 0,
    totalExercises: 0,
    dueCards: 0,
    progress: 0,
    streak: 0,
    bestStreak: 0,
  });
  const [levelFilter, setLevelFilter] = useState<string>(searchParams.get('level') ?? 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [tagFilter, setTagFilter] = useState<string>(searchParams.get('tag') ?? 'all');
  const [collectionFilter, setCollectionFilter] = useState<string>(searchParams.get('collection') ?? 'all');
  const [topTags, setTopTags] = useState<[string, number][]>([]);
  const [levelOptions, setLevelOptions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [deckDue, setDeckDue] = useState<{ deck: string; due: number; status: string }[]>([]);
  const [weakestTag, setWeakestTag] = useState<{ tag: string; accuracy: number } | undefined>();
  const [lastStudiedOn, setLastStudiedOn] = useState<string | undefined>();
  const [inspirationTag, setInspirationTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { timelineCards, plannerAnchor, goalMap, updateGoal, clearGoal } = usePlannerActions();
  const [goalDrafts, setGoalDrafts] = useState({
    yesterday: { note: '', scheduledFor: '', reminder: '' },
    today: { note: '', scheduledFor: '', reminder: '' },
    tomorrow: { note: '', scheduledFor: '', reminder: '' },
  });

  useEffect(() => {
    setGoalDrafts({
      yesterday: {
        note: goalMap.yesterday?.note ?? '',
        scheduledFor: goalMap.yesterday?.scheduledFor ?? '',
        reminder: goalMap.yesterday?.reminder ?? '',
      },
      today: {
        note: goalMap.today?.note ?? '',
        scheduledFor: goalMap.today?.scheduledFor ?? '',
        reminder: goalMap.today?.reminder ?? '',
      },
      tomorrow: {
        note: goalMap.tomorrow?.note ?? '',
        scheduledFor: goalMap.tomorrow?.scheduledFor ?? '',
        reminder: goalMap.tomorrow?.reminder ?? '',
      },
    });
  }, [goalMap]);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [lessonItems, exercises, flashcards, grades] = await Promise.all([
        db.lessons.toArray(),
        db.exercises.toArray(),
        db.flashcards.toArray(),
        db.grades.toArray(),
      ]);
      return { lessonItems, exercises, flashcards, grades };
    }).subscribe({
      next: ({ lessonItems, exercises, flashcards, grades }) => {
        const analytics = computeAnalytics(lessonItems, exercises, grades, flashcards);
        const counts = exercises.reduce<Record<string, number>>((acc, exercise) => {
          acc[exercise.lessonId] = (acc[exercise.lessonId] ?? 0) + 1;
          return acc;
        }, {});
        const masteryMap = new Map(analytics.lessonMastery.map((entry) => [entry.lessonId, entry]));
        const recommendationMap = new Map(analytics.studyPlan.map((entry) => [entry.lessonId, entry]));

        const derivedItems: LessonLibraryItem[] = lessonItems.map((lesson) => {
          const mastery = masteryMap.get(lesson.id);
          const rec = recommendationMap.get(lesson.id);
          return {
            lesson,
            exerciseCount: counts[lesson.id] ?? 0,
            masteredCount: mastery?.masteredExercises ?? 0,
            attemptedCount: mastery?.attemptedExercises ?? 0,
            accuracy: mastery?.accuracy ?? 0,
            lastAttemptAt: mastery?.lastAttemptAt,
            recommendation: rec?.reason,
            recommendationPriority: rec?.priority,
          };
        });

        const uniqueLevels = Array.from(new Set(lessonItems.map((lesson) => lesson.level)));
        uniqueLevels.sort((a, b) => {
          const indexA = levelOrder.indexOf(a);
          const indexB = levelOrder.indexOf(b);
          if (indexA === -1 && indexB === -1) return a.localeCompare(b);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        const masteredExercises = analytics.lessonMastery.reduce(
          (total, entry) => total + entry.masteredExercises,
          0
        );
        const totalExercises = exercises.length;
        const progress = totalExercises ? (masteredExercises / totalExercises) * 100 : 0;

        const tagCounts = new Map<string, number>();
        lessonItems.forEach((lesson) => {
          lesson.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
          });
        });

        const tagList = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12);

        const dueDecks = analytics.srs.deckBreakdown
          .map((entry) => {
            const deckCards = flashcards.filter((card) => card.deck === entry.deck);
            const dueCard = deckCards.find((card) => isDue(card));
            const upcomingCard = deckCards.reduce<typeof deckCards[number] | undefined>((closest, card) => {
              if (!card.srs?.nextDue) return closest;
              if (!closest?.srs?.nextDue) return card;
              return new Date(card.srs.nextDue) < new Date(closest.srs.nextDue) ? card : closest;
            }, undefined);
            const referenceCard = dueCard ?? upcomingCard;
            const status = referenceCard ? describeDueStatus(referenceCard) : 'No cards scheduled';
            return {
              deck: entry.deck,
              due: entry.due,
              status,
            };
          })
          .sort((a, b) => b.due - a.due);

        setLessons(lessonItems);
        setItems(derivedItems);
        setLevelOptions(uniqueLevels);
        setTopTags(tagList);
        setRecommendations(
          analytics.studyPlan.slice(0, 3).map((entry) => ({
            lessonId: entry.lessonId,
            lessonSlug: entry.lessonSlug,
            title: entry.lessonTitle,
            reason: entry.reason,
            priority: entry.priority,
          }))
        );
        setDeckDue(dueDecks);
        setWeakestTag(
          analytics.weakestTags[0]
            ? { tag: analytics.weakestTags[0].tag, accuracy: analytics.weakestTags[0].accuracy }
            : undefined
        );
        setStats({
          totalLessons: lessonItems.length,
          totalExercises,
          dueCards: analytics.srs.dueNow,
          progress,
          streak: analytics.streak.current,
          bestStreak: analytics.streak.best,
        });
        setLastStudiedOn(analytics.streak.lastStudiedOn);
        setLoading(false);
      },
      error: (error) => {
        console.error('Failed to load home overview', error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setLevelFilter(searchParams.get('level') ?? 'all');
    setSearchTerm(searchParams.get('q') ?? '');
    setTagFilter(searchParams.get('tag') ?? 'all');
    setCollectionFilter(searchParams.get('collection') ?? 'all');
  }, [searchParams]);

  useEffect(() => {
    if (tagFilter !== 'all') {
      setInspirationTag(tagFilter);
    }
  }, [tagFilter]);

  useEffect(() => {
    if (!inspirationTag && topTags[0]) {
      setInspirationTag(topTags[0][0]);
    }
  }, [topTags, inspirationTag]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    updateParam('q', trimmed ? trimmed : null);
  };

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    collectionOptions.forEach((option) => {
      counts[option.value] = lessons.filter((lesson) => option.matcher(lesson)).length;
    });
    return counts;
  }, [lessons]);

  const activeCollection = useMemo(
    () => collectionOptions.find((option) => option.value === collectionFilter) ?? collectionOptions[0],
    [collectionFilter]
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredLessons = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const tag = tagFilter === 'all' ? null : tagFilter;
    return items
      .filter((item) => {
        if (levelFilter !== 'all' && item.lesson.level !== levelFilter) return false;
        if (tag && !item.lesson.tags.includes(tag)) return false;
        if (!activeCollection.matcher(item.lesson)) return false;
        if (normalizedSearch) {
          const haystack = [
            item.lesson.title.toLowerCase(),
            item.lesson.tags.join(' ').toLowerCase(),
          ];
          if (!haystack.some((entry) => entry.includes(normalizedSearch))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aPriority = a.recommendationPriority ?? Number.POSITIVE_INFINITY;
        const bPriority = b.recommendationPriority ?? Number.POSITIVE_INFINITY;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aReason = a.recommendation ? 0 : 1;
        const bReason = b.recommendation ? 0 : 1;
        if (aReason !== bReason) return aReason - bReason;
        const aTime = a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0;
        const bTime = b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0;
        const recentDiff = bTime - aTime;
        if (recentDiff !== 0) return recentDiff;
        return a.lesson.title.localeCompare(b.lesson.title, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [items, levelFilter, tagFilter, deferredSearchTerm, activeCollection]);

  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(24);
  }, [filteredLessons.length, deferredSearchTerm, tagFilter, levelFilter, collectionFilter]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const element = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev >= filteredLessons.length) return prev;
            return Math.min(filteredLessons.length, prev + 24);
          });
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [filteredLessons.length]);

  const visibleLessons = useMemo(
    () => filteredLessons.slice(0, visibleCount),
    [filteredLessons, visibleCount]
  );

  const primaryRecommendation = recommendations[0];
  const primaryDeck = deckDue[0];
  const focusBlocks = useMemo(
    () => [
      {
        id: 'lesson',
        label: 'Deep dive lesson',
        title: primaryRecommendation ? primaryRecommendation.title : 'Choose a lesson that excites you',
        description: primaryRecommendation
          ? primaryRecommendation.reason
          : 'Browse the library to build a focus block for today.',
        to: primaryRecommendation?.lessonSlug ? `/lessons/${primaryRecommendation.lessonSlug}` : plannerAnchor,
        icon: '📘',
        badge: primaryRecommendation ? 'Recommended' : undefined,
      },
      {
        id: 'review',
        label: 'Flashcard sprint',
        title: primaryDeck ? `${describeDeck(primaryDeck.deck)} deck` : 'Flashcards',
        description: primaryDeck
          ? `${primaryDeck.due} card${primaryDeck.due === 1 ? '' : 's'} ready · ${primaryDeck.status}`
          : stats.dueCards > 0
          ? `${stats.dueCards} card${stats.dueCards === 1 ? '' : 's'} waiting across decks.`
          : 'No cards due — run a freestyle warm-up to stay sharp.',
        to: '/flashcards',
        icon: '⚡️',
        badge: stats.dueCards > 0 ? `${stats.dueCards} due` : undefined,
      },
      {
        id: 'skill',
        label: 'Skill spotlight',
        title: weakestTag ? weakestTag.tag : 'Pick a theme',
        description: weakestTag
          ? `Accuracy ${Math.round(weakestTag.accuracy)}% — boost this focus area with a review.`
          : 'Complete a lesson to surface the skill that needs attention.',
        to: weakestTag ? `/dashboard?focus=${encodeURIComponent(weakestTag.tag)}` : '/dashboard',
        icon: '🎯',
        badge: weakestTag ? 'Needs love' : undefined,
      },
    ],
    [plannerAnchor, primaryDeck, primaryRecommendation, stats.dueCards, weakestTag]
  );

  const hasActiveFilters =
    levelFilter !== 'all' ||
    tagFilter !== 'all' ||
    collectionFilter !== 'all' ||
    Boolean(searchTerm.trim());

  const handleClearFilters = () => {
    setLevelFilter('all');
    setTagFilter('all');
    setCollectionFilter('all');
    setSearchTerm('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const activeTheme = tagFilter !== 'all' ? tagFilter : inspirationTag ?? topTags[0]?.[0];
  const activeThemeCount = activeTheme
    ? topTags.find(([tag]) => tag === activeTheme)?.[1]
    : undefined;

  const handleSpinTheme = () => {
    if (topTags.length === 0) return;
    const random = topTags[Math.floor(Math.random() * topTags.length)][0];
    setInspirationTag(random);
    updateParam('tag', random);
  };

  const handleThemeClick = (tag: string) => {
    if (tagFilter === tag) {
      updateParam('tag', null);
    } else {
      updateParam('tag', tag);
    }
  };

  const activeLevelCopy = levelFilter === 'all' ? null : levelCopy[levelFilter];

  const handleGoalDraftChange = (id: TimelineId, field: 'note' | 'scheduledFor' | 'reminder', value: string) => {
    setGoalDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>, id: TimelineId) => {
    event.preventDefault();
    const draft = goalDrafts[id];
    updateGoal({
      id,
      note: draft.note.trim(),
      scheduledFor: draft.scheduledFor ? draft.scheduledFor : null,
      reminder: draft.reminder ? draft.reminder : null,
    });
  };

  const handleGoalClear = (id: TimelineId) => {
    clearGoal(id);
    setGoalDrafts((prev) => ({
      ...prev,
      [id]: { note: '', scheduledFor: '', reminder: '' },
    }));
  };

  return (
    <div className={styles.page} aria-labelledby="planner-heading">
      <section className={`ui-card ui-card--accent ${styles.timeline}`} aria-labelledby="planner-heading">
        <div className={styles.timelineIntro}>
          <p className={styles.sectionTag}>Planner</p>
          <h1 id="planner-heading" className={styles.timelineTitle}>
            Plan your next Spanish win
          </h1>
          <p className={styles.timelineSubtitle}>
            A calm place to see progress and jump into the next best action.
          </p>
        </div>
        <div className={styles.timelineStats} aria-label="Key progress stats">
          <div className={styles.timelineStat}>
            <span className={styles.timelineStatLabel}>Lessons imported</span>
            <span className={styles.timelineStatValue}>{stats.totalLessons}</span>
          </div>
          <div className={styles.timelineStat}>
            <span className={styles.timelineStatLabel}>Mastery progress</span>
            <span className={styles.timelineStatValue}>{Math.round(stats.progress)}%</span>
          </div>
          <div className={styles.timelineStat}>
            <span className={styles.timelineStatLabel}>Flashcards due</span>
            <span className={styles.timelineStatValue}>{stats.dueCards}</span>
          </div>
        </div>
        <div className={styles.timelineCards} role="list">
          {timelineCards.map((card) => {
            const draft = goalDrafts[card.id];
            return (
              <article key={card.id} className={styles.timelineCard} role="listitem">
                <span className={styles.timelineCardLabel}>{card.label}</span>
                <h2 className={styles.timelineCardTitle}>{card.title}</h2>
                <p className={styles.timelineCardDescription}>{card.description}</p>
                <Link to={card.actionTo} className={styles.timelineCardAction}>
                  {card.actionLabel} <span aria-hidden="true">→</span>
                </Link>
                <form
                  className={styles.timelineForm}
                  onSubmit={(event) => handleGoalSubmit(event, card.id)}
                  aria-label={`Schedule goal for ${card.label}`}
                >
                  <label htmlFor={`${card.id}-goal-note`} className={styles.timelineFormLabel}>
                    Goal or reminder
                  </label>
                  <textarea
                    id={`${card.id}-goal-note`}
                    className={styles.timelineFormNote}
                    value={draft.note}
                    onChange={(event) => handleGoalDraftChange(card.id, 'note', event.target.value)}
                    rows={2}
                    placeholder="Describe what success looks like"
                  />
                  <div className={styles.timelineFormRow}>
                    <label className={styles.timelineFormLabel} htmlFor={`${card.id}-scheduled`}>
                      Target date
                    </label>
                    <input
                      id={`${card.id}-scheduled`}
                      type="date"
                      value={draft.scheduledFor}
                      onChange={(event) => handleGoalDraftChange(card.id, 'scheduledFor', event.target.value)}
                      className={styles.timelineFormInput}
                    />
                    <label className={styles.timelineFormLabel} htmlFor={`${card.id}-reminder`}>
                      Reminder time
                    </label>
                    <input
                      id={`${card.id}-reminder`}
                      type="time"
                      value={draft.reminder}
                      onChange={(event) => handleGoalDraftChange(card.id, 'reminder', event.target.value)}
                      className={styles.timelineFormInput}
                    />
                  </div>
                  <div className={styles.timelineFormActions}>
                    <button type="submit" className="ui-button ui-button--small">
                      Save plan
                    </button>
                    {(card.goal?.note || card.goal?.scheduledFor || card.goal?.reminder) && (
                      <button
                        type="button"
                        className="ui-button ui-button--ghost ui-button--small"
                        onClick={() => handleGoalClear(card.id)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {card.goal && (
                    <p className={styles.timelinePlanSummary} aria-live="polite">
                      {card.goal.note && <span>Saved: {card.goal.note}. </span>}
                      {card.goal.scheduledFor && <span>Scheduled for {card.goal.scheduledFor}. </span>}
                      {card.goal.reminder && <span>Reminder at {card.goal.reminder}.</span>}
                    </p>
                  )}
                </form>
              </article>
            );
          })}
        </div>
        <p className={styles.timelineFootnote} aria-live="polite">
          Current streak {stats.streak} day{stats.streak === 1 ? '' : 's'} · Best {stats.bestStreak}
        </p>
      </section>

      <section className={`ui-card ${styles.focusSection}`} aria-labelledby="focus-heading">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionTag}>Focus blocks</p>
            <h2 id="focus-heading" className={styles.sectionTitle}>
              Start with one quick win
            </h2>
            <p className={styles.sectionSubtitle}>
              These cards adapt as you complete lessons, reviews, and drills.
            </p>
          </div>
        </header>
        <div className={styles.focusGrid} role="list">
          {focusBlocks.map((block) => (
            <Link key={block.id} to={block.to} className={styles.focusCard} role="listitem">
              <span className={styles.focusLabel}>{block.label}</span>
              <div className={styles.focusTitleRow}>
                <span className={styles.focusIcon} aria-hidden="true">
                  {block.icon}
                </span>
                <h3 className={styles.focusTitle}>{block.title}</h3>
              </div>
              <p className={styles.focusDescription}>{block.description}</p>
              {block.badge && <span className={styles.focusBadge}>{block.badge}</span>}
              <span className={styles.focusCta}>
                Open {block.label.toLowerCase()} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="lesson-library"
        className={`ui-card ${styles.library}`}
        aria-labelledby="library-heading"
      >
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionTag}>Lesson library</p>
            <h2 id="library-heading" className={styles.sectionTitle}>
              Build your study lane
            </h2>
            <p className={styles.sectionSubtitle}>
              {activeLevelCopy?.description ?? 'Filter by level, collection, or theme to personalise your plan.'}
            </p>
          </div>
          <form className={styles.searchForm} role="search" onSubmit={handleSearchSubmit}>
            <label htmlFor="lesson-search" className="sr-only">
              Search lessons
            </label>
            <input
              id="lesson-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search titles or tags"
              className={styles.searchInput}
              type="search"
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </header>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Level</span>
            <div className={styles.pillGroup}>
              <button
                type="button"
                className={`${styles.pill} ${levelFilter === 'all' ? styles.pillActive : ''}`}
                onClick={() => updateParam('level', null)}
              >
                All levels
              </button>
              {levelOptions.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.pill} ${levelFilter === level ? styles.pillActive : ''}`}
                  onClick={() => updateParam('level', level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Curated tracks</span>
            <div className={styles.collectionScroller}>
              {collectionOptions.map((option) => {
                const count = collectionCounts[option.value] ?? 0;
                const isActive = collectionFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.collectionCard} ${isActive ? styles.collectionCardActive : ''}`}
                    onClick={() =>
                      isActive ? updateParam('collection', null) : updateParam('collection', option.value)
                    }
                    title={option.description}
                  >
                    <span className={styles.collectionLabel}>{option.label}</span>
                    <span className={styles.collectionCount}>
                      {count} lesson{count === 1 ? '' : 's'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            <span>Filters applied.</span>
            <button type="button" onClick={handleClearFilters} className={styles.clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <p className={styles.emptyState} aria-live="polite">
            Loading library…
          </p>
        ) : lessons.length === 0 ? (
          <p className={styles.emptyState} aria-live="polite">
            No lessons imported yet. <Link to="/onboarding">Launch the guided onboarding</Link> to install the starter
            dataset or head to the Content manager to import your own bundle.
          </p>
        ) : filteredLessons.length === 0 ? (
          <p className={styles.emptyState} aria-live="polite">
            No lessons match your filters. Try adjusting the level, collection, or search term.
          </p>
        ) : (
          <>
            <div className={styles.lessonGrid}>
              {visibleLessons.map((item) => {
                const { lesson } = item;
              const masteryPercent = item.exerciseCount
                ? Math.round((item.masteredCount / item.exerciseCount) * 100)
                : 0;
              return (
                <Link key={lesson.id} to={`/lessons/${lesson.slug}`} className={styles.lessonCard}>
                  <div className={styles.lessonHeader}>
                    <span className={styles.lessonLevel}>Level {lesson.level}</span>
                    {item.recommendation && <span className={styles.lessonBadge}>Suggested</span>}
                  </div>
                  <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                  <p className={styles.lessonMeta}>
                    {item.exerciseCount} practice item{item.exerciseCount === 1 ? '' : 's'} · {masteryPercent}% mastered
                  </p>
                  <div className={styles.lessonTags} aria-label={`Tags for ${lesson.title}`}>
                    {lesson.tags.length === 0 && <span className={styles.lessonTag}>No tags yet</span>}
                    {lesson.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.lessonTag}>
                        {tag}
                      </span>
                    ))}
                    {lesson.tags.length > 3 && (
                      <span className={styles.lessonTag}>+{lesson.tags.length - 3}</span>
                    )}
                  </div>
                  <div className={styles.lessonFooter}>
                    <span>{formatLibraryRelativeTime(item.lastAttemptAt)}</span>
                    <span className={styles.lessonCta}>
                      Open lesson <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              );
              })}
              <div ref={sentinelRef} aria-hidden="true" />
            </div>
            {visibleLessons.length < filteredLessons.length && (
              <p className={styles.loadHint} role="status">
                Showing {visibleLessons.length} of {filteredLessons.length} lessons. Scroll for more.
              </p>
            )}
          </>
        )}
      </section>

      <section className={`ui-card ${styles.inspiration}`} aria-labelledby="inspiration-heading">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionTag}>Need variety?</p>
            <h2 id="inspiration-heading" className={styles.sectionTitle}>
              Spin a new theme
            </h2>
            <p className={styles.sectionSubtitle}>
              Switch things up with a quick prompt pulled from your library tags.
            </p>
          </div>
          <div className={styles.wheelActions}>
            <button
              type="button"
              className={styles.spinButton}
              onClick={handleSpinTheme}
              disabled={topTags.length === 0}
            >
              Spin theme
            </button>
            {tagFilter !== 'all' && (
              <button type="button" className={styles.clearFilters} onClick={() => updateParam('tag', null)}>
                Clear theme
              </button>
            )}
          </div>
        </header>
        {topTags.length > 0 ? (
          <>
            {activeTheme && (
              <div className={styles.themeSpotlight} aria-live="polite">
                <span className={styles.themeLabel}>Spotlight</span>
                <strong className={styles.themeValue}>{activeTheme}</strong>
                {typeof activeThemeCount === 'number' && (
                  <span className={styles.themeCount}>
                    {activeThemeCount} lesson{activeThemeCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            )}
            <div className={styles.themeGrid}>
              {topTags.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.topicTag} ${tagFilter === tag ? styles.topicTagActive : ''}`}
                  onClick={() => handleThemeClick(tag)}
                  title={`${count} lesson${count === 1 ? '' : 's'}`}
                >
                  <span>{tag}</span>
                  <span className={styles.topicCount}>×{count}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.emptyState}>
            Tags will appear once you import lessons.{' '}
            <Link to="/content-manager">Add a content bundle to get started.</Link>
          </p>
        )}
      </section>
    </div>
  );
};

export default HomePage;

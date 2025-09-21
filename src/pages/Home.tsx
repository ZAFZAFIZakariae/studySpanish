import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { liveQuery } from 'dexie';
import { db } from '../db';
import { Lesson } from '../lib/schemas';
import { computeAnalytics } from '../lib/analytics';
import { describeDueStatus, isDue } from '../lib/srs';
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

type SortOrder = 'recommended' | 'recent' | 'alphabetical' | 'mastery';

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'recommended', label: 'Recommended first' },
  { value: 'recent', label: 'Recently studied' },
  { value: 'alphabetical', label: 'A → Z' },
  { value: 'mastery', label: 'Lowest mastery' },
];

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

const formatRelativeTime = (value?: string) => {
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

interface QuickShortcut {
  label: string;
  description: string;
  to?: string;
  href?: string;
}

const quickShortcuts: QuickShortcut[] = [
  {
    label: 'Browse lessons',
    description: 'Jump straight to the full library view.',
    href: '#lesson-library',
  },
  {
    label: 'Review dashboard',
    description: 'Check streaks and mastery trends.',
    to: '/dashboard',
  },
  {
    label: 'Flashcard trainer',
    description: 'Clear today’s review queue.',
    to: '/flashcards',
  },
  {
    label: 'Content manager',
    description: 'Sync the latest lessons to your device.',
    to: '/content-manager',
  },
];

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
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sort') as SortOrder) ?? 'recommended'
  );
  const [tagFilter, setTagFilter] = useState<string>(searchParams.get('tag') ?? 'all');
  const [collectionFilter, setCollectionFilter] = useState<string>(
    searchParams.get('collection') ?? 'all'
  );
  const [topTags, setTopTags] = useState<[string, number][]>([]);
  const [levelOptions, setLevelOptions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [deckDue, setDeckDue] = useState<{ deck: string; due: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

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
        const recommendationMap = new Map(
          analytics.studyPlan.map((entry) => [entry.lessonId, entry])
        );

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
        setStats({
          totalLessons: lessonItems.length,
          totalExercises,
          dueCards: analytics.srs.dueNow,
          progress,
          streak: analytics.streak.current,
          bestStreak: analytics.streak.best,
        });
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
    setSortOrder((searchParams.get('sort') as SortOrder) ?? 'recommended');
    setTagFilter(searchParams.get('tag') ?? 'all');
    setCollectionFilter(searchParams.get('collection') ?? 'all');
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
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

  const filteredLessons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
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
        if (sortOrder === 'alphabetical') {
          return a.lesson.title.localeCompare(b.lesson.title);
        }
        if (sortOrder === 'mastery') {
          return a.accuracy - b.accuracy;
        }
        if (sortOrder === 'recent') {
          const aTime = a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0;
          const bTime = b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0;
          return bTime - aTime;
        }
        // recommended
        const aPriority = a.recommendationPriority ?? Number.POSITIVE_INFINITY;
        const bPriority = b.recommendationPriority ?? Number.POSITIVE_INFINITY;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aReason = a.recommendation ? 0 : 1;
        const bReason = b.recommendation ? 0 : 1;
        if (aReason !== bReason) return aReason - bReason;
        const aTime = a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0;
        const bTime = b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [items, levelFilter, tagFilter, searchTerm, sortOrder, activeCollection]);

  const levelGroups = useMemo(() => {
    const grouped = new Map<string, LessonLibraryItem[]>();
    filteredLessons.forEach((item) => {
      const list = grouped.get(item.lesson.level) ?? [];
      list.push(item);
      grouped.set(item.lesson.level, list);
    });
    const order = levelFilter === 'all' ? levelOptions : [levelFilter];
    return order.map((level) => ({
      level,
      lessons: grouped.get(level) ?? [],
    }));
  }, [filteredLessons, levelFilter, levelOptions]);

  const roundedProgress = Math.round(stats.progress);
  const primaryRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 3);
  const primaryDeck = deckDue[0];
  const secondaryDecks = deckDue.slice(1, 3);

  return (
    <div className={styles.page} aria-labelledby="home-heading">
      <section className={`ui-card ui-card--accent ${styles.hero}`} aria-labelledby="home-heading">
        <div className={styles.heroContent}>
          <h1 id="home-heading" className={styles.heroTitle}>
            Plan your next Spanish session
          </h1>
          <p className={styles.heroDescription} aria-live="polite">
            Keep tabs on progress and jump back into focused study in just a few clicks.
          </p>
          <div className={styles.heroActions}>
            <a href="#lesson-library" className="ui-button ui-button--primary">
              Browse lesson library ↗
            </a>
            <Link to="/dashboard" className="ui-button ui-button--ghost">
              Review dashboard →
            </Link>
          </div>
          <p className={styles.heroNote} aria-live="polite">
            Streak {stats.streak} day{stats.streak === 1 ? '' : 's'} · Best {stats.bestStreak}
          </p>
        </div>
        <dl className={styles.heroStats} aria-label="Key progress stats">
          <div className={styles.heroStatsItem} title="Total lessons currently available in your offline library">
            <dt>Lessons imported</dt>
            <dd aria-live="polite">{stats.totalLessons}</dd>
          </div>
          <div className={styles.heroStatsItem} title="Percentage of exercises where the latest attempt was correct">
            <dt>Mastery progress</dt>
            <dd aria-live="polite">{roundedProgress}%</dd>
          </div>
          <div className={styles.heroStatsItem} title="Cards currently ready for review">
            <dt>Due flashcards</dt>
            <dd aria-live="polite">{stats.dueCards}</dd>
          </div>
        </dl>
      </section>

      <section className="ui-card" aria-labelledby="overview-heading">
        <div className="ui-section">
          <div>
            <p className="ui-section__tag">Today</p>
            <h2 id="overview-heading" className="ui-section__title">
              Focus for this session
            </h2>
            <p className="ui-section__subtitle">
              Start with the highlighted lesson or clear your review queue.
            </p>
          </div>
        </div>
        <div className={styles.nextGrid}>
          <article className={styles.nextCard}>
            <h3>Recommended lesson</h3>
            {primaryRecommendation ? (
              <>
                <Link
                  to={
                    primaryRecommendation.lessonSlug
                      ? `/lessons/${primaryRecommendation.lessonSlug}`
                      : '#'
                  }
                  className={styles.nextLink}
                >
                  <span className={styles.nextTitle}>{primaryRecommendation.title}</span>
                  <span className={styles.nextMeta}>{primaryRecommendation.reason}</span>
                </Link>
                {secondaryRecommendations.length > 0 && (
                  <ul className={styles.nextList}>
                    {secondaryRecommendations.map((item) => (
                      <li key={item.lessonId}>
                        <Link
                          to={item.lessonSlug ? `/lessons/${item.lessonSlug}` : '#'}
                          className={styles.nextListLink}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className={styles.nextEmpty}>Recommendations appear once you complete a lesson.</p>
            )}
          </article>
          <article className={styles.nextCard}>
            <h3>Review queue</h3>
            {primaryDeck ? (
              <>
                <p className={styles.nextTitle}>{primaryDeck.deck}</p>
                <p className={styles.nextMeta}>
                  {primaryDeck.due} card{primaryDeck.due === 1 ? '' : 's'} due
                </p>
                <p className={styles.nextHint}>{primaryDeck.status}</p>
                {secondaryDecks.length > 0 && (
                  <ul className={styles.nextList}>
                    {secondaryDecks.map((entry) => (
                      <li key={entry.deck}>
                        {entry.deck} · {entry.due} due
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className={styles.nextEmpty}>You're all caught up on reviews.</p>
            )}
          </article>
          <div className={styles.quickActions}>
            <h3>Shortcuts</h3>
            <ul className={styles.quickActionsList}>
              {quickShortcuts.map((shortcut) => {
                const ActionComponent = (shortcut.to ? Link : 'a') as React.ElementType;
                const actionProps = shortcut.to ? { to: shortcut.to } : { href: shortcut.href ?? '#' };
                return (
                  <li key={shortcut.label}>
                    <ActionComponent className={styles.quickActionsLink} {...actionProps}>
                      <span>{shortcut.label}</span>
                      <span>{shortcut.description}</span>
                    </ActionComponent>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section id="lesson-library" className="ui-card" aria-labelledby="library-heading">
        <div className={styles.libraryHeader}>
          <div>
            <p className="ui-section__tag">Lesson library</p>
            <h2 id="library-heading" className="ui-section__title">
              Browse your lessons
            </h2>
            <p className="ui-section__subtitle">
              Filter by level, tags, and mastery data to line up the right objective.
            </p>
          </div>
          <div className={styles.libraryControls}>
            <div className={styles.searchControl}>
              <label htmlFor="library-search" className="sr-only">
                Search lessons
              </label>
              <input
                id="library-search"
                type="search"
                value={searchTerm}
                onChange={(event) => updateParam('q', event.target.value || null)}
                placeholder="Search titles or tags…"
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="sort-order" className="sr-only">
                Sort order
              </label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(event) => updateParam('sort', event.target.value as SortOrder)}
                className={styles.sortSelect}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className={styles.filterButtons}>
                <button
                  type="button"
                  onClick={() => updateParam('level', 'all')}
                  className={styles.filterButton}
                  data-active={levelFilter === 'all'}
                >
                  All levels
                </button>
                {levelOptions.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateParam('level', level)}
                    className={styles.filterButton}
                    data-active={levelFilter === level}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={styles.collectionFilters}
              role="group"
              aria-label="Browse lesson collections"
            >
              {collectionOptions.map((option) => {
                const count = collectionCounts[option.value] ?? 0;
                const isActive = collectionFilter === option.value;
                const disableOption = option.value !== 'all' && !count;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={styles.collectionButton}
                    data-active={isActive}
                    aria-pressed={isActive}
                    title={option.description}
                    onClick={() =>
                      updateParam('collection', option.value === 'all' ? null : option.value)
                    }
                    disabled={disableOption}
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
        {loading ? (
          <p className={styles.emptyState} aria-live="polite">
            Loading library…
          </p>
        ) : lessons.length === 0 ? (
          <p className={styles.emptyState} aria-live="polite">
            No lessons imported yet. Use the Content manager to add the latest content drop.
          </p>
        ) : (
          levelGroups.map(({ level, lessons: groupLessons }) => {
            const copy = levelCopy[level] ?? {
              title: `Level ${level}`,
              description: 'Build a customised progression even if this is a custom level.',
            };
            return (
              <article key={level} className={styles.lessonGroup}>
                <header className={styles.groupHeader}>
                  <div>
                    <h3 className={styles.groupTitle}>{copy.title}</h3>
                    <p className={styles.groupDescription}>{copy.description}</p>
                  </div>
                  <span className={styles.groupCount}>
                    {groupLessons.length} lesson{groupLessons.length === 1 ? '' : 's'}
                  </span>
                </header>
                {groupLessons.length > 0 ? (
                  <div className={styles.lessonGrid}>
                    {groupLessons.map((item) => {
                      const { lesson } = item;
                      const masteryPercent = item.exerciseCount
                        ? Math.round((item.masteredCount / item.exerciseCount) * 100)
                        : 0;
                      return (
                        <Link
                          key={lesson.id}
                          to={`/lessons/${lesson.slug}`}
                          className={styles.lessonCard}
                        >
                          <div className={styles.lessonMeta}>
                            <span>Level {lesson.level}</span>
                            <span>
                              {item.exerciseCount} practice {item.exerciseCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                          <div>
                            <h4 className={styles.lessonTitle}>{lesson.title}</h4>
                            <div className={styles.lessonTags} aria-label={`Tags for ${lesson.title}`}>
                              {lesson.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className={styles.lessonTag}>
                                  {tag}
                                </span>
                              ))}
                              {lesson.tags.length === 0 && <span className={styles.lessonTag}>No tags yet</span>}
                              {lesson.tags.length > 3 && (
                                <span className={styles.lessonTag}>+{lesson.tags.length - 3}</span>
                              )}
                            </div>
                          </div>
                          <div className={styles.lessonFooter}>
                            <span>{masteryPercent}% mastered</span>
                            <span>{formatRelativeTime(item.lastAttemptAt)}</span>
                            {item.recommendation && (
                              <span className={styles.lessonRecommendation}>{item.recommendation}</span>
                            )}
                          </div>
                          <span className={styles.lessonLink}>Open lesson →</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.emptyState}>No lessons imported for this level yet.</p>
                )}
              </article>
            );
          })
        )}
      </section>

      <section className="ui-card" aria-labelledby="tag-heading">
        <div className="ui-section">
          <div>
            <p className="ui-section__tag">Topics on your radar</p>
            <h2 id="tag-heading" className="ui-section__title">
              Mix your sessions
            </h2>
          </div>
        </div>
        {topTags.length > 0 ? (
          <div className={styles.topicsCloud}>
            {topTags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={`${styles.topicTag} ${tagFilter === tag ? styles.topicTagActive : ''}`}
                title={`${count} lesson${count === 1 ? '' : 's'}`}
                onClick={() => updateParam('tag', tagFilter === tag ? null : tag)}
              >
                <span>{tag}</span>
                <span className={styles.topicCount}>×{count}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            Tags will appear once you import lessons.{" "}
            <Link to="/content-manager">Add a content bundle to get started.</Link>
          </p>
        )}
      </section>
    </div>
  );
};

export default HomePage;

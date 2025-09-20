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
    title: 'Level A1 · Foundations first',
    description: 'Build confidence with essential verbs, greetings, and survival phrases.',
  },
  A2: {
    title: 'Level A2 · Everyday exchanges',
    description: 'Tackle routine tasks, preferences, and descriptions with ease.',
  },
  B1: {
    title: 'Level B1 · Build confident fluency',
    description: 'Polish everyday grammar, narration and fast-paced conversations.',
  },
  B2: {
    title: 'Level B2 · Debate and defend ideas',
    description: 'Stretch your argumentation with precise connectors and register shifts.',
  },
  C1: {
    title: 'Level C1 · Present like a pro',
    description: 'Rehearse debates, briefings and formal presentations with advanced vocabulary.',
  },
  C2: {
    title: 'Level C2 · Master nuance',
    description: 'Perfect idiomatic turns of phrase and stylistic control for any audience.',
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

const focusSteps = [
  {
    title: 'Study plan preview',
    description: 'Open the dashboard to review streaks, trends, and the weakest tags before you begin.',
    actionLabel: 'Open dashboard',
    to: '/dashboard',
  },
  {
    title: 'Queue the right lesson',
    description: 'Use search, level filters, and mastery stats below to choose the next objective.',
    actionLabel: 'Browse lessons',
    anchor: '#lesson-library',
  },
  {
    title: 'Targeted flashcard sprint',
    description: 'Pick the due deck called out in the sidebar and cap the session to match your schedule.',
    actionLabel: 'Start trainer',
    to: '/flashcards',
  },
  {
    title: 'Sync content and notes',
    description: 'Pull the newest JSON bundle and jot findings in the changelog once you wrap up.',
    actionLabel: 'Content manager',
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
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const filteredLessons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const tag = tagFilter === 'all' ? null : tagFilter;
    return items
      .filter((item) => {
        if (levelFilter !== 'all' && item.lesson.level !== levelFilter) return false;
        if (tag && !item.lesson.tags.includes(tag)) return false;
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
  }, [items, levelFilter, tagFilter, searchTerm, sortOrder]);

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

  return (
    <div className={styles.page} aria-labelledby="home-heading">
      <section className={`ui-card ui-card--accent ${styles.hero}`} aria-labelledby="home-heading">
        <div className={styles.heroContent}>
          <p className={styles.heroTag}>Plan with intention</p>
          <h1 id="home-heading" className={styles.heroTitle}>
            Your bilingual study coach for structured B1–C1 Spanish practice
          </h1>
          <p className={styles.heroDescription} aria-live="polite">
            Scan progress, pick a lesson, and drill the right flashcards — all in one organised workspace that works online or offline.
          </p>
          <div className={styles.heroActions}>
            <a href="#lesson-library" className="ui-button ui-button--primary">
              Browse lesson library ↗
            </a>
            <Link to="/dashboard" className="ui-button ui-button--ghost">
              Check progress dashboard →
            </Link>
          </div>
          <div className={styles.heroChips}>
            <span className="ui-chip">Study smarter</span>
            <span className="ui-chip">Offline ready</span>
            <span className="ui-chip">Streak {stats.streak} 🔥</span>
          </div>
        </div>
        <dl className={styles.heroStats} aria-label="Study stats">
          <div className={styles.heroStatsItem} title="Total lessons currently available in your offline library">
            <dt>Lessons imported</dt>
            <dd aria-live="polite">{stats.totalLessons}</dd>
          </div>
          <div className={styles.heroStatsItem} title="Exercises available across all lessons">
            <dt>Practice items</dt>
            <dd aria-live="polite">{stats.totalExercises}</dd>
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

      <section className="ui-card" aria-labelledby="focus-heading">
        <div className="ui-section">
          <div>
            <p className="ui-section__tag">Today’s focus loop</p>
            <h2 id="focus-heading" className="ui-section__title">
              Keep your speaking, writing, and recall sharp
            </h2>
            <p className="ui-section__subtitle">
              Cycle through these steps to keep your Spanish practice feeling like a Duolingo streak with pro-level depth.
            </p>
          </div>
        </div>
        <div className={styles.focusGrid}>
          {focusSteps.map(({ title, description, actionLabel, to, anchor }) => {
            const ActionComponent = (to ? Link : 'a') as React.ElementType;
            const actionProps = to ? { to } : { href: anchor ?? '#' };
            return (
              <article key={title} className={styles.focusCard}>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <ActionComponent className={styles.focusAction} {...actionProps}>
                  {actionLabel} →
                </ActionComponent>
              </article>
            );
          })}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="ui-card" aria-labelledby="recommendations-heading">
          <div className="ui-section">
            <div>
              <p className="ui-section__tag">Suggested next steps</p>
              <h2 id="recommendations-heading" className="ui-section__title">
                Resume exactly where analytics left off
              </h2>
              <p className="ui-section__subtitle">
                These exercises bubble up from your latest dashboard snapshot — tackle the first card to keep momentum.
              </p>
            </div>
          </div>
          <ol className={styles.recommendations}>
            {recommendations.map((item) => (
              <li key={item.lessonId}>
                <Link to={item.lessonSlug ? `/lessons/${item.lessonSlug}` : '#'}>
                  <span className={styles.recommendationTitle}>{item.title}</span>
                  <span className={styles.recommendationReason}>{item.reason}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {deckDue.length > 0 && (
        <section className="ui-card" aria-labelledby="deck-heading">
          <div className="ui-section">
            <div>
              <p className="ui-section__tag">Flashcard readiness</p>
              <h2 id="deck-heading" className="ui-section__title">Due decks at a glance</h2>
              <p className="ui-section__subtitle">
                Start with the deck that has the highest due count, or pick a deck whose due date matches your available time.
              </p>
            </div>
          </div>
          <div className={styles.deckGrid}>
            {deckDue.map((entry) => (
              <div key={entry.deck} className={styles.deckCard}>
                <p className={styles.deckTitle}>{entry.deck}</p>
                <p className={styles.deckDue}>{entry.due} due</p>
                <p className={styles.deckHint}>{entry.status}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="lesson-library" className="ui-card" aria-labelledby="library-heading">
        <div className={styles.libraryHeader}>
          <div>
            <p className="ui-section__tag">Lesson library</p>
            <h2 id="library-heading" className="ui-section__title">
              Match today’s focus with the right material
            </h2>
            <p className="ui-section__subtitle">
              Organised by level and powered by your latest mastery data so you can pick the objective that fits your next conversation or presentation.
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

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Lesson } from '../lib/schemas';
import { isDue } from '../lib/srs';
import styles from './Home.module.css';

interface LibraryStats {
  totalLessons: number;
  totalExercises: number;
  dueCards: number;
  progress: number;
}

const levelBlueprint: { level: Lesson['level']; title: string; description: string }[] = [
  {
    level: 'B1',
    title: 'Level B1 · Build confident fluency',
    description: 'Polish everyday grammar, narration and fast-paced conversations.',
  },
  {
    level: 'C1',
    title: 'Level C1 · Present like a pro',
    description: 'Rehearse debates, briefings and formal presentations with advanced vocabulary.',
  },
];

const focusSteps = [
  {
    title: 'Check your analytics',
    description: 'Identify the tags and lessons that need another pass before your next conversation.',
    actionLabel: 'Open dashboard',
    to: '/dashboard',
  },
  {
    title: 'Pick a lesson objective',
    description: 'Use the library below to choose the next B1 or C1 target for today’s session.',
    actionLabel: 'Browse lessons',
    anchor: '#lesson-library',
  },
  {
    title: 'Reinforce with flashcards',
    description: 'Rotate through due verbs, connectors, and presentation phrases in the trainer.',
    actionLabel: 'Start trainer',
    to: '/flashcards',
  },
  {
    title: 'Refresh your content',
    description: 'Import the latest JSON bundle so fresh lessons, exercises, and flashcards stay in sync.',
    actionLabel: 'Content manager',
    to: '/content-manager',
  },
];

export const HomePage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<LibraryStats>({
    totalLessons: 0,
    totalExercises: 0,
    dueCards: 0,
    progress: 0,
  });
  const [libraryFilter, setLibraryFilter] = useState<'all' | Lesson['level']>('all');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [lessonItems, exercises, flashcards, grades] = await Promise.all([
        db.lessons.toArray(),
        db.exercises.toArray(),
        db.flashcards.toArray(),
        db.grades.toArray(),
      ]);
      if (!active) return;
      const sorted = [...lessonItems].sort((a, b) => a.title.localeCompare(b.title));
      setLessons(sorted);

      const mastered = new Set(grades.filter((grade) => grade.isCorrect).map((grade) => grade.exerciseId));
      const progress = exercises.length ? (mastered.size / exercises.length) * 100 : 0;
      const due = flashcards.filter(isDue).length;
      const counts = exercises.reduce<Record<string, number>>((acc, exercise) => {
        acc[exercise.lessonId] = (acc[exercise.lessonId] ?? 0) + 1;
        return acc;
      }, {});
      setStats({
        totalLessons: lessonItems.length,
        totalExercises: exercises.length,
        dueCards: due,
        progress,
      });
      setExerciseCounts(counts);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const levelGroups = useMemo(
    () =>
      levelBlueprint.map((section) => ({
        ...section,
        lessons: lessons.filter((lesson) => lesson.level === section.level),
      })),
    [lessons]
  );

  const filteredGroups = useMemo(
    () =>
      libraryFilter === 'all'
        ? levelGroups
        : levelGroups.filter((group) => group.level === libraryFilter),
    [levelGroups, libraryFilter]
  );

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    lessons.forEach((lesson) => {
      lesson.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [lessons]);

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
            <span className="ui-chip">B1 · C1</span>
          </div>
        </div>
        <dl className={styles.heroStats} aria-label="Study stats">
          <div className={styles.heroStatsItem}>
            <dt>Lessons imported</dt>
            <dd aria-live="polite">{stats.totalLessons}</dd>
          </div>
          <div className={styles.heroStatsItem}>
            <dt>Practice items</dt>
            <dd aria-live="polite">{stats.totalExercises}</dd>
          </div>
          <div className={styles.heroStatsItem}>
            <dt>Mastery progress</dt>
            <dd aria-live="polite">{roundedProgress}%</dd>
          </div>
          <div className={styles.heroStatsItem}>
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

      <section id="lesson-library" className="ui-card" aria-labelledby="library-heading">
        <div className={styles.libraryHeader}>
          <div>
            <p className="ui-section__tag">Lesson library</p>
            <h2 id="library-heading" className="ui-section__title">
              Match today’s focus with the right material
            </h2>
            <p className="ui-section__subtitle">
              Organised by CEFR level so you can pick the objective that fits your next conversation or presentation.
            </p>
          </div>
          <div className={styles.filterGroup}>
            {(['all', 'B1', 'C1'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setLibraryFilter(filter)}
                className={styles.filterButton}
                data-active={libraryFilter === filter}
              >
                {filter === 'all' ? 'All levels' : `Level ${filter}`}
              </button>
            ))}
          </div>
        </div>
        {lessons.length === 0 ? (
          <p className={styles.emptyState} aria-live="polite">
            No lessons imported yet. Use the Content manager to add the latest content drop.
          </p>
        ) : (
          filteredGroups.map(({ level, title, description, lessons: groupLessons }) => (
            <article key={level} className={styles.lessonGroup}>
              <header className={styles.groupHeader}>
                <div>
                  <h3 className={styles.groupTitle}>{title}</h3>
                  <p className={styles.groupDescription}>{description}</p>
                </div>
                <span className={styles.groupCount}>
                  {groupLessons.length} lesson{groupLessons.length === 1 ? '' : 's'}
                </span>
              </header>
              {groupLessons.length > 0 ? (
                <div className={styles.lessonGrid}>
                  {groupLessons.map((lesson) => {
                    const count = exerciseCounts[lesson.id] ?? 0;
                    return (
                      <Link key={lesson.id} to={`/lessons/${lesson.slug}`} className={styles.lessonCard}>
                        <div className={styles.lessonMeta}>
                          <span>Level {lesson.level}</span>
                          <span>{count} practice {count === 1 ? 'item' : 'items'}</span>
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
                        <span className={styles.lessonLink}>
                          Open lesson →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.emptyState}>No lessons imported for this level yet.</p>
              )}
            </article>
          ))
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
              <span key={tag} className={styles.topicTag} title={`${count} lesson${count === 1 ? '' : 's'}`}>
                <span>{tag}</span>
                <span className={styles.topicCount}>×{count}</span>
              </span>
            ))}
          </div>
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

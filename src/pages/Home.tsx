import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Lesson } from '../lib/schemas';
import { isDue } from '../lib/srs';

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
    <div className="space-y-12" aria-labelledby="home-heading">
      <section
        className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 text-white shadow-2xl"
        aria-labelledby="home-heading"
      >
        <div className="absolute inset-y-0 left-1/2 h-full w-[480px] -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-32 bottom-[-180px] h-[420px] w-[420px] rounded-full bg-emerald-400/30 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-100/80">Plan with intention</p>
            <h1 id="home-heading" className="text-4xl font-bold leading-snug">
              Your bilingual study coach for structured B1–C1 Spanish practice
            </h1>
            <p className="max-w-xl text-base text-blue-50/90" aria-live="polite">
              Scan progress, pick a lesson, and drill the right flashcards—all in one organised workspace that
              works online or offline.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#lesson-library"
                className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:bg-white focus-visible:ring"
              >
                Browse lesson library
                <span aria-hidden="true" className="text-base">
                  ↗
                </span>
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-transparent px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:ring"
              >
                Check progress dashboard
                <span aria-hidden="true" className="text-base">
                  →
                </span>
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.45em] text-blue-100/70">
              <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-500/40 px-3 py-1">
                Study smarter
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-500/30 px-3 py-1">
                Offline ready
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-500/30 px-3 py-1">
                B1 · C1
              </span>
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2" aria-label="Study stats">
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-blue-900/30">
              <dt className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Lessons imported</dt>
              <dd className="mt-2 text-3xl font-bold text-white" aria-live="polite">
                {stats.totalLessons}
              </dd>
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/10 to-transparent" aria-hidden="true" />
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-blue-900/30">
              <dt className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Practice items</dt>
              <dd className="mt-2 text-3xl font-bold text-white" aria-live="polite">
                {stats.totalExercises}
              </dd>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-blue-900/30">
              <dt className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Mastery progress</dt>
              <dd className="mt-2 text-3xl font-bold text-white" aria-live="polite">
                {roundedProgress}%
              </dd>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-blue-900/30">
              <dt className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Due flashcards</dt>
              <dd className="mt-2 text-3xl font-bold text-white" aria-live="polite">
                {stats.dueCards}
              </dd>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-blue-100/70">Ready for a sprint</p>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur"
        aria-labelledby="focus-heading"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="focus-heading" className="text-2xl font-semibold text-slate-900">
              Today’s focus loop
            </h2>
            <p className="text-sm text-slate-600">
              Cycle through these steps to keep your speaking, writing, and recall sharp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.35em] text-slate-400">
            <span className="rounded-full border border-slate-200 px-3 py-1">Plan → Learn → Review</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {focusSteps.map(({ title, description, actionLabel, to, anchor }) => {
            const ActionComponent = (to ? Link : 'a') as React.ElementType;
            const actionProps = to ? { to } : { href: anchor ?? '#' };
            return (
              <article
                key={title}
                className="group relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>
                <ActionComponent
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:text-blue-600 focus-visible:ring"
                  {...actionProps}
                >
                  {actionLabel}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </ActionComponent>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 translate-y-12 rounded-t-full bg-gradient-to-t from-blue-100/30 via-transparent" aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="lesson-library"
        className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/50 backdrop-blur"
        aria-labelledby="library-heading"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="library-heading" className="text-2xl font-semibold text-slate-900">
              Lesson library
            </h2>
            <p className="text-sm text-slate-600">
              Organised by CEFR level so you can match today’s focus with the right material.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'B1', 'C1'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setLibraryFilter(filter)}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:ring ${
                  libraryFilter === filter
                    ? 'border-blue-500 bg-blue-600 text-white shadow'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                {filter === 'all' ? 'All levels' : `Level ${filter}`}
              </button>
            ))}
          </div>
        </div>
        {lessons.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600"
            aria-live="polite"
          >
            No lessons imported yet. Use the Content manager to add the latest content drop.
          </p>
        ) : (
          filteredGroups.map(({ level, title, description, lessons: groupLessons }) => (
            <article key={level} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {groupLessons.length} lesson{groupLessons.length === 1 ? '' : 's'}
                </span>
              </header>
              {groupLessons.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupLessons.map((lesson) => {
                    const count = exerciseCounts[lesson.id] ?? 0;
                    return (
                      <Link
                        key={lesson.id}
                        to={`/lessons/${lesson.slug}`}
                        className="group relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl focus-visible:ring"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Level {lesson.level}</span>
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                            {count} practice {count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-slate-900">{lesson.title}</h4>
                          <div className="flex flex-wrap gap-2" aria-label={`Tags for ${lesson.title}`}>
                            {lesson.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                            {lesson.tags.length === 0 && (
                              <span className="text-xs text-slate-400">No tags yet</span>
                            )}
                            {lesson.tags.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                +{lesson.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:translate-x-1">
                          Open lesson
                          <span aria-hidden="true">→</span>
                        </span>
                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 translate-y-12 bg-gradient-to-t from-blue-100/30 via-transparent transition group-hover:translate-y-6"
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No lessons imported for this level yet.</p>
              )}
            </article>
          ))
        )}
      </section>

      <section
        className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur"
        aria-labelledby="tag-heading"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 id="tag-heading" className="text-xl font-semibold text-slate-900">
            Topics on your radar
          </h2>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mix your sessions</p>
        </div>
        {topTags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm"
                title={`${count} lesson${count === 1 ? '' : 's'}`}
              >
                <span>{tag}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">×{count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            Tags will appear once you import lessons.{' '}
            <Link to="/content-manager" className="text-blue-700 underline focus-visible:ring">
              Add a content bundle to get started.
            </Link>
          </p>
        )}
      </section>
    </div>
  );
};

export default HomePage;

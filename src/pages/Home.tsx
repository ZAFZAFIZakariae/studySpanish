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

export const HomePage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalLessons: 0,
    totalExercises: 0,
    dueCards: 0,
    progress: 0,
  });

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
      setStats({
        totalLessons: lessonItems.length,
        totalExercises: exercises.length,
        dueCards: due,
        progress,
      });
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
    <div className="space-y-10" aria-labelledby="home-heading">
      <section className="rounded-2xl border bg-white p-6 shadow-sm" aria-labelledby="home-heading">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="space-y-4 lg:max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Plan with intention</p>
            <h1 id="home-heading" className="text-3xl font-bold text-slate-900">
              Your bilingual study coach for structured B1–C1 Spanish practice
            </h1>
            <p className="text-lg text-slate-600" aria-live="polite">
              Scan progress, pick a lesson, and drill the right flashcards—all in one organised workspace that
              works online or offline.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#lesson-library"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:ring"
              >
                Browse lesson library
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 focus-visible:ring"
              >
                Check progress dashboard
              </Link>
            </div>
          </div>
          <dl className="grid flex-shrink-0 gap-4 sm:grid-cols-2" aria-label="Study stats">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center">
              <dt className="text-xs font-semibold uppercase tracking-widest text-blue-600">Lessons imported</dt>
              <dd className="mt-1 text-2xl font-bold text-blue-900" aria-live="polite">
                {stats.totalLessons}
              </dd>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center">
              <dt className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Practice items</dt>
              <dd className="mt-1 text-2xl font-bold text-indigo-900" aria-live="polite">
                {stats.totalExercises}
              </dd>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
              <dt className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Mastery progress</dt>
              <dd className="mt-1 text-2xl font-bold text-emerald-900" aria-live="polite">
                {roundedProgress}%
              </dd>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
              <dt className="text-xs font-semibold uppercase tracking-widest text-amber-600">Due flashcards</dt>
              <dd className="mt-1 text-2xl font-bold text-amber-900" aria-live="polite">
                {stats.dueCards}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="focus-heading">
        <div className="space-y-2">
          <h2 id="focus-heading" className="text-2xl font-semibold text-slate-900">
            Today’s focus loop
          </h2>
          <p className="text-sm text-slate-600">
            Cycle through these steps to keep your speaking, writing, and recall sharp.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="flex h-full flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Check your analytics</h3>
              <p className="text-sm text-slate-600">
                Identify the tags and lessons that need another pass before your next conversation.
              </p>
            </div>
            <Link to="/dashboard" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
              Open dashboard
            </Link>
          </article>
          <article className="flex h-full flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Pick a lesson objective</h3>
              <p className="text-sm text-slate-600">
                Use the library below to choose the next B1 or C1 target for today’s session.
              </p>
            </div>
            <a href="#lesson-library" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
              Browse lessons
            </a>
          </article>
          <article className="flex h-full flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Reinforce with flashcards</h3>
              <p className="text-sm text-slate-600">
                Rotate through due verbs, connectors, and presentation phrases in the trainer.
              </p>
            </div>
            <Link to="/flashcards" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
              Start trainer
            </Link>
          </article>
          <article className="flex h-full flex-col justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Update your content</h3>
              <p className="text-sm text-slate-600">
                Import the latest JSON bundle so fresh lessons, exercises, and flashcards stay in sync.
              </p>
            </div>
            <Link to="/content-manager" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
              Go to Content manager
            </Link>
          </article>
        </div>
      </section>

      <section id="lesson-library" className="space-y-5" aria-labelledby="library-heading">
        <div className="space-y-2">
          <h2 id="library-heading" className="text-2xl font-semibold text-slate-900">
            Lesson library
          </h2>
          <p className="text-sm text-slate-600">
            Organised by CEFR level so you can match today’s focus with the right material.
          </p>
        </div>
        {lessons.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-4 text-sm text-slate-600" aria-live="polite">
            No lessons imported yet. Use the Content manager to add the latest content drop.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {levelGroups.map(({ level, title, description, lessons: groupLessons }) => (
              <article key={level} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
                <header className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600">
                    {description}{' '}
                    <span className="font-medium text-slate-700">
                      {groupLessons.length} lesson{groupLessons.length === 1 ? '' : 's'}
                    </span>
                  </p>
                </header>
                {groupLessons.length > 0 ? (
                  <ul className="space-y-2" role="list">
                    {groupLessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="rounded-lg border border-slate-200 px-3 py-2 transition hover:border-blue-300"
                      >
                        <Link
                          to={`/lessons/${lesson.slug}`}
                          className="text-sm font-medium text-blue-700 underline focus-visible:ring"
                        >
                          {lesson.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500" aria-label={`Tags for ${lesson.title}`}>
                          {lesson.tags.join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">No lessons imported for this level yet.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="tag-heading">
        <h2 id="tag-heading" className="text-xl font-semibold text-slate-900">
          Topics on your radar
        </h2>
        {topTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
                title={`${count} lesson${count === 1 ? '' : 's'}`}
              >
                <span>{tag}</span>
                <span className="ml-2 text-xs font-normal text-blue-600" aria-hidden="true">
                  ×{count}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
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

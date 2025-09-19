import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db';
import { Exercise, Lesson } from '../lib/schemas';
import { LessonViewer } from '../components/LessonViewer';
import { ExerciseEngine } from '../components/ExerciseEngine';

const LessonPage: React.FC = () => {
  const { slug } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    const load = async () => {
      const found = await db.lessons.where('slug').equals(slug).first();
      if (!active) return;
      if (!found) {
        setStatus('missing');
        return;
      }
      setLesson(found);
      const lessonExercises = await db.exercises.where('lessonId').equals(found.id).toArray();
      if (!active) return;
      setExercises(lessonExercises);
      setStatus('ready');
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (status === 'loading') {
    return (
      <p role="status" className="italic">
        Loading lesson…
      </p>
    );
  }

  if (status === 'missing' || !lesson) {
    return (
      <p role="alert" className="text-red-600">
        Lesson not found. Import the latest content drop to continue.
      </p>
    );
  }

  return (
    <article className="space-y-8" aria-labelledby="lesson-title">
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
            ← Back to overview
          </Link>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
            Level {lesson.level}
          </span>
        </div>
        <div className="space-y-3">
          <h1 id="lesson-title" className="text-3xl font-bold text-slate-900">
            {lesson.title}
          </h1>
          <div className="flex flex-wrap gap-2" aria-label="Lesson tags">
            {lesson.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-600">
            {exercises.length > 0
              ? `${exercises.length} practice activit${exercises.length === 1 ? 'y' : 'ies'} ready to log.`
              : 'Review the notes, then import a practice set to track mastery.'}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <section className="space-y-4 rounded-xl border bg-white p-6 shadow-sm" aria-labelledby="lesson-content-heading">
            <h2 id="lesson-content-heading" className="text-xl font-semibold text-slate-900">
              Lesson content
            </h2>
            <LessonViewer markdown={lesson.markdown} />
          </section>

          <section className="space-y-4 rounded-xl border bg-white p-6 shadow-sm" aria-labelledby="lesson-exercises-heading">
            <div className="space-y-1">
              <h2 id="lesson-exercises-heading" className="text-xl font-semibold text-slate-900">
                Practise the lesson
              </h2>
              <p className="text-sm text-slate-600">
                Work through each prompt to log attempts and unlock mastery progress.
              </p>
            </div>
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="rounded-lg border border-slate-200 p-4 shadow-sm"
                aria-label={`Exercise ${exercise.id}`}
              >
                <ExerciseEngine exercise={exercise} />
              </div>
            ))}
            {exercises.length === 0 && (
              <p role="status" className="text-sm italic text-slate-600">
                No exercises found for this lesson yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 rounded-xl border bg-white p-6 shadow-sm" aria-label="Study guidance">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Study roadmap</h2>
            <ol className="space-y-2 text-sm text-slate-600">
              <li>Skim the key idea and underline new connectors or discourse markers.</li>
              <li>Complete the practice set, logging hints and timings for the dashboard.</li>
              <li>
                Finish with a flashcard sprint to reinforce the phrases you want to reuse.
              </li>
            </ol>
          </section>
          <section className="space-y-2 text-sm text-slate-600">
            <p>Need a quick spaced-repetition loop after this lesson?</p>
            <Link to="/flashcards" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
              Jump to the flashcard trainer
            </Link>
          </section>
          {lesson.references?.length ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">References</h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {lesson.references.map((reference, index) => (
                  <li key={`${reference}-${index}`}>{reference}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
};

export default LessonPage;

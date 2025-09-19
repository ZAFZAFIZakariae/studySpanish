import React, { useCallback, useMemo, useState } from 'react';
import { importSeed } from '../seed';
import { SeedBundle, SeedBundleSchema } from '../seed/seedTypes';
import { Exercise, Lesson } from '../lib/schemas';
import { db } from '../db';

interface DiffSummary {
  newLessons: Lesson[];
  updatedLessons: Lesson[];
  newExercises: Exercise[];
  updatedExercises: Exercise[];
}

const emptyDiff: DiffSummary = {
  newLessons: [],
  updatedLessons: [],
  newExercises: [],
  updatedExercises: [],
};

const ContentManagerPage: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [bundle, setBundle] = useState<SeedBundle | null>(null);
  const [diff, setDiff] = useState<DiffSummary>(emptyDiff);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setBundle(null);
    setDiff(emptyDiff);
    setErrors([]);
    setStatus('');
  };

  const computeDiff = useCallback(async (data: SeedBundle) => {
    const [existingLessons, existingExercises] = await Promise.all([
      db.lessons.toArray(),
      db.exercises.toArray(),
    ]);
    const lessonsById = new Map(existingLessons.map((lesson) => [lesson.id, lesson]));
    const exercisesById = new Map(existingExercises.map((exercise) => [exercise.id, exercise]));

    const newLessons: Lesson[] = [];
    const updatedLessons: Lesson[] = [];
    data.lessons.forEach((lesson) => {
      const current = lessonsById.get(lesson.id);
      if (!current) {
        newLessons.push(lesson);
      } else if (JSON.stringify(current) !== JSON.stringify(lesson)) {
        updatedLessons.push(lesson);
      }
    });

    const newExercises: Exercise[] = [];
    const updatedExercises: Exercise[] = [];
    data.exercises.forEach((exercise) => {
      const current = exercisesById.get(exercise.id);
      if (!current) {
        newExercises.push(exercise);
      } else if (JSON.stringify(current) !== JSON.stringify(exercise)) {
        updatedExercises.push(exercise);
      }
    });

    setDiff({ newLessons, updatedLessons, newExercises, updatedExercises });
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetState();
      return;
    }

    setFileName(file.name);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = SeedBundleSchema.safeParse(json);
      if (!parsed.success) {
        setBundle(null);
        setDiff(emptyDiff);
        setErrors(parsed.error.errors.map((issue) => `${issue.path.join('.')} – ${issue.message}`));
        setStatus('Validation failed. Fix the errors below.');
        return;
      }

      setErrors([]);
      setBundle(parsed.data);
      setStatus('Validation passed. Review the preview diff before importing.');
      await computeDiff(parsed.data);
    } catch (error) {
      setErrors([`Unable to parse file: ${(error as Error).message}`]);
      setBundle(null);
      setDiff(emptyDiff);
      setStatus('Validation failed.');
    }
  };

  const diffSummary = useMemo(() => ({
    lessons: {
      new: diff.newLessons.length,
      updated: diff.updatedLessons.length,
    },
    exercises: {
      new: diff.newExercises.length,
      updated: diff.updatedExercises.length,
    },
  }), [diff]);

  const updateOfflineCache = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const [lessons, exercises] = await Promise.all([
      db.lessons.toArray(),
      db.exercises.toArray(),
    ]);
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'CACHE_DATA',
      lessons,
      exercises,
    });
  }, []);

  const handleImport = async () => {
    if (!bundle) return;
    setImporting(true);
    try {
      await importSeed(bundle);
      await computeDiff(bundle);
      await updateOfflineCache();
      setStatus(`Imported ${bundle.lessons.length} lessons and ${bundle.exercises.length} exercises.`);
    } catch (error) {
      setErrors([`Import failed: ${(error as Error).message}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="content-manager-heading">
      <header className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Content pipeline</p>
        <h1 id="content-manager-heading" className="text-3xl font-bold text-slate-900">
          Content manager
        </h1>
        <p className="text-sm text-slate-600">
          Import vetted JSON content drops, preview the diff, and keep the learner database indexed for offline use.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
            <label htmlFor="content-upload" className="font-semibold text-slate-800">
              Upload JSON bundle
            </label>
            <input
              id="content-upload"
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              aria-describedby="content-upload-help"
            />
            <p id="content-upload-help" className="text-sm text-slate-600">
              The file should follow the SeedBundle schema with <code>lessons</code>, <code>exercises</code>, and
              <code>flashcards</code> arrays.
            </p>
            {fileName && (
              <p className="text-sm text-slate-600" aria-live="polite">
                Selected file: <strong>{fileName}</strong>
              </p>
            )}
          </section>

          {status && (
            <div
              role="status"
              className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
              aria-live="polite"
            >
              {status}
            </div>
          )}

          {errors.length > 0 && (
            <div
              role="alert"
              className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4"
              aria-live="assertive"
            >
              <h2 className="text-sm font-semibold text-red-700">Validation errors</h2>
              <ul className="ml-5 list-disc text-sm text-red-700">
                {errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {bundle && errors.length === 0 && (
            <section className="space-y-4 rounded-xl border bg-white p-4 shadow-sm" aria-live="polite">
              <header className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">Preview diff</h2>
                <p className="text-sm text-slate-600">
                  Confirm how many lessons and exercises will be inserted or updated before importing.
                </p>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3" aria-label="Lesson diff summary">
                  <h3 className="text-sm font-semibold text-slate-800">Lessons</h3>
                  <p className="text-sm text-slate-600">New: {diffSummary.lessons.new}</p>
                  <p className="text-sm text-slate-600">Updated: {diffSummary.lessons.updated}</p>
                  {diff.newLessons.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-700 underline">View new lessons</summary>
                      <ul className="ml-5 list-disc text-sm text-slate-600">
                        {diff.newLessons.map((lesson) => (
                          <li key={lesson.id}>{lesson.title}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {diff.updatedLessons.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-700 underline">View lesson updates</summary>
                      <ul className="ml-5 list-disc text-sm text-slate-600">
                        {diff.updatedLessons.map((lesson) => (
                          <li key={lesson.id}>{lesson.title}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 p-3" aria-label="Exercise diff summary">
                  <h3 className="text-sm font-semibold text-slate-800">Exercises</h3>
                  <p className="text-sm text-slate-600">New: {diffSummary.exercises.new}</p>
                  <p className="text-sm text-slate-600">Updated: {diffSummary.exercises.updated}</p>
                  {diff.newExercises.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-700 underline">View new exercises</summary>
                      <ul className="ml-5 list-disc text-sm text-slate-600">
                        {diff.newExercises.map((exercise) => (
                          <li key={exercise.id}>{exercise.promptMd.slice(0, 60)}…</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {diff.updatedExercises.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-700 underline">View exercise updates</summary>
                      <ul className="ml-5 list-disc text-sm text-slate-600">
                        {diff.updatedExercises.map((exercise) => (
                          <li key={exercise.id}>{exercise.promptMd.slice(0, 60)}…</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:ring"
                disabled={importing}
                aria-label="Import validated content"
              >
                {importing ? 'Importing…' : 'Import content'}
              </button>
            </section>
          )}
        </div>

        <aside className="space-y-4 rounded-xl border bg-white p-4 shadow-sm" aria-label="Import guidance">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Import checklist</h2>
            <ol className="space-y-2 text-sm text-slate-600">
              <li>Download the latest <code>.json</code> bundle from your content pipeline.</li>
              <li>Upload it here to validate the structure and preview the diff.</li>
              <li>
                When the diff looks right, press <span className="font-semibold text-slate-800">Import content</span>{' '}
                to update the on-device cache.
              </li>
            </ol>
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Bundle structure</h2>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>
                <code>lessons[]</code> — Markdown content with <code>level</code>, <code>tags</code>, and optional
                references.
              </li>
              <li>
                <code>exercises[]</code> — Practice prompts linked by <code>lessonId</code>.
              </li>
              <li>
                <code>flashcards[]</code> — Deck metadata powering the spaced repetition trainer.
              </li>
            </ul>
          </section>
          <section className="text-sm text-slate-600">
            <p>
              After importing, the service worker updates its offline cache so lessons, exercises, and flashcards are
              available without a connection.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default ContentManagerPage;

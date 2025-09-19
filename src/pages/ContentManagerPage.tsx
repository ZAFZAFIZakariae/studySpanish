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
    <section className="space-y-5" aria-labelledby="content-manager-heading">
      <header className="space-y-2">
        <h1 id="content-manager-heading" className="text-2xl font-bold">
          Content Manager
        </h1>
        <p className="text-sm text-gray-600">
          Import vetted JSON content drops, preview the diff, and keep the learner database indexed for offline use.
        </p>
      </header>

      <div className="space-y-3">
        <label htmlFor="content-upload" className="font-medium">
          Upload JSON bundle
        </label>
        <input
          id="content-upload"
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          aria-describedby="content-upload-help"
        />
        <p id="content-upload-help" className="text-sm text-gray-600">
          The file should follow the SeedBundle schema with lessons, exercises, and flashcards arrays.
        </p>
        {fileName && (
          <p className="text-sm" aria-live="polite">
            Selected file: <strong>{fileName}</strong>
          </p>
        )}
      </div>

      {status && (
        <div role="status" className="rounded border border-blue-200 bg-blue-50 p-3" aria-live="polite">
          {status}
        </div>
      )}

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 space-y-1"
          aria-live="assertive"
        >
          <h2 className="font-semibold">Validation errors</h2>
          <ul className="list-disc ml-5 text-sm">
            {errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {bundle && errors.length === 0 && (
        <div className="space-y-4" aria-live="polite">
          <h2 className="text-xl font-semibold">Preview diff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border p-3" aria-label="Lesson diff summary">
              <h3 className="font-semibold">Lessons</h3>
              <p className="text-sm">New: {diffSummary.lessons.new}</p>
              <p className="text-sm">Updated: {diffSummary.lessons.updated}</p>
              {diff.newLessons.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">View new lessons</summary>
                  <ul className="list-disc ml-5 text-sm">
                    {diff.newLessons.map((lesson) => (
                      <li key={lesson.id}>{lesson.title}</li>
                    ))}
                  </ul>
                </details>
              )}
              {diff.updatedLessons.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">View lesson updates</summary>
                  <ul className="list-disc ml-5 text-sm">
                    {diff.updatedLessons.map((lesson) => (
                      <li key={lesson.id}>{lesson.title}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <div className="rounded border p-3" aria-label="Exercise diff summary">
              <h3 className="font-semibold">Exercises</h3>
              <p className="text-sm">New: {diffSummary.exercises.new}</p>
              <p className="text-sm">Updated: {diffSummary.exercises.updated}</p>
              {diff.newExercises.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">View new exercises</summary>
                  <ul className="list-disc ml-5 text-sm">
                    {diff.newExercises.map((exercise) => (
                      <li key={exercise.id}>{exercise.promptMd.slice(0, 60)}…</li>
                    ))}
                  </ul>
                </details>
              )}
              {diff.updatedExercises.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">View exercise updates</summary>
                  <ul className="list-disc ml-5 text-sm">
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
            className="bg-green-600 text-white px-4 py-2 rounded focus-visible:ring"
            disabled={importing}
            aria-label="Import validated content"
          >
            {importing ? 'Importing…' : 'Import content'}
          </button>
        </div>
      )}
    </section>
  );
};

export default ContentManagerPage;

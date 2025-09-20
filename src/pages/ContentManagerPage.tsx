import React, { useCallback, useMemo, useState } from 'react';
import { importSeed } from '../seed';
import { Exercise, Lesson, SeedBundle, SeedBundleSchema } from '../lib/schemas';
import { db } from '../db';
import styles from './ContentManagerPage.module.css';

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

  const diffSummary = useMemo(
    () => ({
      lessons: {
        new: diff.newLessons.length,
        updated: diff.updatedLessons.length,
      },
      exercises: {
        new: diff.newExercises.length,
        updated: diff.updatedExercises.length,
      },
    }),
    [diff]
  );

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
    <section className={styles.page} aria-labelledby="content-manager-heading">
      <header className="ui-card ui-card--strong">
        <span className="ui-section__tag">Content pipeline</span>
        <h1 id="content-manager-heading" className="ui-section__title">
          Content manager
        </h1>
        <p className="ui-section__subtitle">
          Import vetted JSON content drops, preview the diff, and keep the learner database indexed for offline use.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.sectionGroup}>
          <section className="ui-card">
            <span className="ui-section__tag">Upload JSON bundle</span>
            <label htmlFor="content-upload" className="ui-section__title">
              Select bundle
            </label>
            <input
              id="content-upload"
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              aria-describedby="content-upload-help"
            />
            <p id="content-upload-help" className="ui-section__subtitle">
              The file should follow the SeedBundle schema with <code>lessons</code>, <code>exercises</code>, and <code>flashcards</code> arrays.
            </p>
            {fileName && (
              <p className="ui-section__subtitle" aria-live="polite">
                Selected file: <strong>{fileName}</strong>
              </p>
            )}
          </section>

          {status && (
            <div role="status" className="ui-alert ui-alert--info" aria-live="polite">
              {status}
            </div>
          )}

          {errors.length > 0 && (
            <div role="alert" className="ui-alert ui-alert--danger" aria-live="assertive">
              <h2 className="ui-section__title">Validation errors</h2>
              <ul className={styles.diffList}>
                {errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {bundle && (
            <section className="ui-card ui-card--muted">
              <span className="ui-section__tag">Preview diff</span>
              <p className="ui-section__subtitle">
                Double-check what’s changing before syncing the bundle to the offline cache.
              </p>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.lessons.new}</strong>
                  New lessons
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.lessons.updated}</strong>
                  Updated lessons
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.exercises.new}</strong>
                  New exercises
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.exercises.updated}</strong>
                  Updated exercises
                </div>
              </div>
              <div className="ui-section">
                {diff.newLessons.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">New lessons</h3>
                    <ul className={styles.diffList}>
                      {diff.newLessons.map((lesson) => (
                        <li key={lesson.id}>{lesson.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.updatedLessons.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">Updated lessons</h3>
                    <ul className={styles.diffList}>
                      {diff.updatedLessons.map((lesson) => (
                        <li key={lesson.id}>{lesson.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.newExercises.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">New exercises</h3>
                    <ul className={styles.diffList}>
                      {diff.newExercises.map((exercise) => (
                        <li key={exercise.id}>{exercise.promptMd.slice(0, 80)}…</li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.updatedExercises.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">Updated exercises</h3>
                    <ul className={styles.diffList}>
                      {diff.updatedExercises.map((exercise) => (
                        <li key={exercise.id}>{exercise.promptMd.slice(0, 80)}…</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="ui-button ui-button--primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? 'Importing…' : 'Import bundle →'}
              </button>
            </section>
          )}
        </div>

        <aside className={styles.sectionGroup} aria-label="Content manager tips">
          <section className="ui-card ui-card--muted">
            <span className="ui-section__tag">Why it matters</span>
            <p className="ui-section__subtitle">
              Use the same bundle across teammates to keep lessons, practice sets, and flashcards aligned. Importing updates the offline cache so learners can work without a connection.
            </p>
            <ul className="ui-section">
              <li>Bundles include lessons, exercises, and flashcards in one JSON file.</li>
              <li>Offline caching refreshes automatically after each import.</li>
              <li>Any validation errors are listed before data is committed.</li>
            </ul>
          </section>
          <section className="ui-card ui-card--muted">
            <span className="ui-section__tag">Next steps</span>
            <p className="ui-section__subtitle">
              After importing, head to the overview to queue a lesson or jump into the flashcard trainer to drill new phrases.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default ContentManagerPage;

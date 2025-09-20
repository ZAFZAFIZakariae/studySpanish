import React, { useCallback, useMemo, useState } from 'react';
import { importSeed } from '../seed';
import { SeedBundle, SeedBundleSchema } from '../seed/seedTypes';
import { Exercise, Flashcard, Lesson } from '../lib/schemas';
import { db } from '../db';
import styles from './ContentManagerPage.module.css';

interface FieldChange {
  field: string;
  before: string;
  after: string;
}

interface UpdatedEntity<T> {
  item: T;
  changes: FieldChange[];
}

interface DiffSummary {
  newLessons: Lesson[];
  updatedLessons: UpdatedEntity<Lesson>[];
  removedLessons: Lesson[];
  newExercises: Exercise[];
  updatedExercises: UpdatedEntity<Exercise>[];
  removedExercises: Exercise[];
  newFlashcards: Flashcard[];
  updatedFlashcards: UpdatedEntity<Flashcard>[];
  removedFlashcards: Flashcard[];
}

const emptyDiff: DiffSummary = {
  newLessons: [],
  updatedLessons: [],
  removedLessons: [],
  newExercises: [],
  updatedExercises: [],
  removedExercises: [],
  newFlashcards: [],
  updatedFlashcards: [],
  removedFlashcards: [],
};

const formatValue = (value: unknown) => {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

const collectChanges = (
  previous: Record<string, unknown> | undefined,
  next: Record<string, unknown>,
  prefix = ''
): FieldChange[] => {
  const fields = new Set([
    ...Object.keys(previous ?? {}),
    ...Object.keys(next ?? {}),
  ]);
  const changes: FieldChange[] = [];
  fields.forEach((key) => {
    const before = previous ? (previous as any)[key] : undefined;
    const after = (next as any)[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      before &&
      after &&
      typeof before === 'object' &&
      !Array.isArray(before) &&
      typeof after === 'object' &&
      !Array.isArray(after)
    ) {
      changes.push(...collectChanges(before as Record<string, unknown>, after as Record<string, unknown>, path));
      return;
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ field: path, before: formatValue(before), after: formatValue(after) });
    }
  });
  return changes;
};

const diffEntity = <T extends Record<string, unknown>>(previous: T | undefined, next: T): FieldChange[] =>
  collectChanges(previous, next);

const ContentManagerPage: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [bundle, setBundle] = useState<SeedBundle | null>(null);
  const [diff, setDiff] = useState<DiffSummary>(emptyDiff);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');

  const resetState = () => {
    setBundle(null);
    setDiff(emptyDiff);
    setErrors([]);
    setStatus('');
  };

  const computeDiff = useCallback(async (data: SeedBundle) => {
    const [existingLessons, existingExercises, existingFlashcards] = await Promise.all([
      db.lessons.toArray(),
      db.exercises.toArray(),
      db.flashcards.toArray(),
    ]);
    const lessonsById = new Map(existingLessons.map((lesson) => [lesson.id, lesson]));
    const exercisesById = new Map(existingExercises.map((exercise) => [exercise.id, exercise]));
    const flashcardsById = new Map(existingFlashcards.map((card) => [card.id, card]));

    const newLessons: Lesson[] = [];
    const updatedLessons: UpdatedEntity<Lesson>[] = [];
    const incomingLessonIds = new Set<string>();
    data.lessons.forEach((lesson) => {
      incomingLessonIds.add(lesson.id);
      const current = lessonsById.get(lesson.id);
      if (!current) {
        newLessons.push(lesson);
        return;
      }
      const changes = diffEntity(current, lesson);
      if (changes.length) {
        updatedLessons.push({ item: lesson, changes });
      }
    });
    const removedLessons = existingLessons.filter((lesson) => !incomingLessonIds.has(lesson.id));

    const newExercises: Exercise[] = [];
    const updatedExercises: UpdatedEntity<Exercise>[] = [];
    const incomingExerciseIds = new Set<string>();
    data.exercises.forEach((exercise) => {
      incomingExerciseIds.add(exercise.id);
      const current = exercisesById.get(exercise.id);
      if (!current) {
        newExercises.push(exercise);
        return;
      }
      const changes = diffEntity(current, exercise);
      if (changes.length) {
        updatedExercises.push({ item: exercise, changes });
      }
    });
    const removedExercises = existingExercises.filter((exercise) => !incomingExerciseIds.has(exercise.id));

    const newFlashcards: Flashcard[] = [];
    const updatedFlashcards: UpdatedEntity<Flashcard>[] = [];
    const incomingFlashcardIds = new Set<string>();
    data.flashcards.forEach((card) => {
      incomingFlashcardIds.add(card.id);
      const current = flashcardsById.get(card.id);
      if (!current) {
        newFlashcards.push(card);
        return;
      }
      const changes = diffEntity(current, card);
      if (changes.length) {
        updatedFlashcards.push({ item: card, changes });
      }
    });
    const removedFlashcards = existingFlashcards.filter((card) => !incomingFlashcardIds.has(card.id));

    setDiff({
      newLessons,
      updatedLessons,
      removedLessons,
      newExercises,
      updatedExercises,
      removedExercises,
      newFlashcards,
      updatedFlashcards,
      removedFlashcards,
    });
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

  const handleFetchRemote = async () => {
    if (!remoteUrl) return;
    setImporting(true);
    try {
      const response = await fetch(remoteUrl);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const json = await response.json();
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
      setStatus(`Fetched bundle from ${remoteUrl}. Review the diff before importing.`);
      await computeDiff(parsed.data);
    } catch (error) {
      setErrors([`Remote fetch failed: ${(error as Error).message}`]);
      setStatus('Unable to fetch remote bundle.');
    } finally {
      setImporting(false);
    }
  };

  const diffSummary = useMemo(
    () => ({
      lessons: {
        new: diff.newLessons.length,
        updated: diff.updatedLessons.length,
        removed: diff.removedLessons.length,
      },
      exercises: {
        new: diff.newExercises.length,
        updated: diff.updatedExercises.length,
        removed: diff.removedExercises.length,
      },
      flashcards: {
        new: diff.newFlashcards.length,
        updated: diff.updatedFlashcards.length,
        removed: diff.removedFlashcards.length,
      },
    }),
    [diff]
  );

  const updateOfflineCache = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const [lessons, exercises, flashcards] = await Promise.all([
      db.lessons.toArray(),
      db.exercises.toArray(),
      db.flashcards.toArray(),
    ]);
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'CACHE_DATA',
      lessons,
      exercises,
      flashcards,
    });
  }, []);

  const handleImport = async () => {
    if (!bundle) return;
    setImporting(true);
    try {
      await importSeed(bundle);
      await db.settings.put({ key: 'last-imported-at', value: new Date().toISOString() });
      if (remoteUrl) {
        await db.settings.put({ key: 'last-import-url', value: remoteUrl });
      }
      await computeDiff(bundle);
      await updateOfflineCache();
      setStatus(
        `Imported ${bundle.lessons.length} lessons, ${bundle.exercises.length} exercises, and ${bundle.flashcards.length} flashcards. Offline cache refreshed.`
      );
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
            <div className={styles.remoteRow}>
              <label htmlFor="remote-url" className={styles.remoteLabel}>
                Or fetch from URL
              </label>
              <div className={styles.remoteControls}>
                <input
                  id="remote-url"
                  type="url"
                  placeholder="https://example.com/spanish-bundle.json"
                  value={remoteUrl}
                  onChange={(event) => setRemoteUrl(event.target.value)}
                  aria-describedby="remote-url-hint"
                />
                <button
                  type="button"
                  className="ui-button ui-button--secondary"
                  onClick={handleFetchRemote}
                  disabled={!remoteUrl || importing}
                >
                  {importing ? 'Fetching…' : 'Fetch bundle'}
                </button>
              </div>
              <p id="remote-url-hint" className="ui-section__subtitle">
                Paste a JSON endpoint or GitHub raw URL. We’ll validate before importing.
              </p>
            </div>
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
                  <strong>{diffSummary.lessons.removed}</strong>
                  Removed lessons
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.exercises.new}</strong>
                  New exercises
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.exercises.updated}</strong>
                  Updated exercises
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.exercises.removed}</strong>
                  Removed exercises
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.flashcards.new}</strong>
                  New flashcards
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.flashcards.updated}</strong>
                  Updated flashcards
                </div>
                <div className={styles.summaryCard}>
                  <strong>{diffSummary.flashcards.removed}</strong>
                  Removed flashcards
                </div>
              </div>
              <div className={styles.diffColumns}>
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
                      {diff.updatedLessons.map(({ item, changes }) => (
                        <li key={item.id}>
                          <strong>{item.title}</strong>
                          <ul className={styles.changeList}>
                            {changes.map((change) => (
                              <li key={change.field}>
                                <code>{change.field}</code>: {change.before} → {change.after}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.removedLessons.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">Removed lessons</h3>
                    <ul className={styles.diffList}>
                      {diff.removedLessons.map((lesson) => (
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
                      {diff.updatedExercises.map(({ item, changes }) => (
                        <li key={item.id}>
                          <strong>{item.promptMd.slice(0, 40)}…</strong>
                          <ul className={styles.changeList}>
                            {changes.map((change) => (
                              <li key={change.field}>
                                <code>{change.field}</code>: {change.before} → {change.after}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.removedExercises.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">Removed exercises</h3>
                    <ul className={styles.diffList}>
                      {diff.removedExercises.map((exercise) => (
                        <li key={exercise.id}>{exercise.promptMd.slice(0, 80)}…</li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.newFlashcards.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">New flashcards</h3>
                    <ul className={styles.diffList}>
                      {diff.newFlashcards.map((card) => (
                        <li key={card.id}>
                          <strong>{card.front}</strong> → {card.back}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.updatedFlashcards.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">Updated flashcards</h3>
                    <ul className={styles.diffList}>
                      {diff.updatedFlashcards.map(({ item, changes }) => (
                        <li key={item.id}>
                          <strong>{item.front}</strong>
                          <ul className={styles.changeList}>
                            {changes.map((change) => (
                              <li key={change.field}>
                                <code>{change.field}</code>: {change.before} → {change.after}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diff.removedFlashcards.length > 0 && (
                  <div>
                    <h3 className="ui-section__title">Removed flashcards</h3>
                    <ul className={styles.diffList}>
                      {diff.removedFlashcards.map((card) => (
                        <li key={card.id}>
                          <strong>{card.front}</strong> → {card.back}
                        </li>
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

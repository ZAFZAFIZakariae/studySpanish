import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { liveQuery } from 'dexie';
import { db } from '../db';
import {
  computeAnalytics,
  AnalyticsSnapshot,
  LessonMasteryStat,
  SkillAccuracy,
  StudyActivityPoint,
} from '../lib/analytics';
import styles from './Dashboard.module.css';

const formatDuration = (ms: number) => {
  if (!ms) return '0m';
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    !hours && !minutes ? `${seconds}s` : null,
  ].filter(Boolean);
  return parts.join(' ');
};

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const formatActivityTooltip = (point: StudyActivityPoint) =>
  `${point.date}: ${point.correct}/${point.total} correct`;

const formatLastStudied = (value?: string) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
};

type LessonSort = 'recent' | 'accuracy';

type SkillSort = 'accuracy' | 'volume';

export const Dashboard: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonSort, setLessonSort] = useState<LessonSort>('recent');
  const [skillSort, setSkillSort] = useState<SkillSort>('accuracy');

  React.useEffect(() => {
    const subscription = liveQuery(async () => {
      const [lessons, exercises, grades, flashcards] = await Promise.all([
        db.lessons.toArray(),
        db.exercises.toArray(),
        db.grades.toArray(),
        db.flashcards.toArray(),
      ]);
      return { lessons, exercises, grades, flashcards };
    }).subscribe({
      next: ({ lessons, exercises, grades, flashcards }) => {
        const mastery = computeAnalytics(lessons, exercises, grades, flashcards);
        const masteredExercises = mastery.lessonMastery.reduce(
          (total, entry) => total + entry.masteredExercises,
          0
        );
        setProgress(exercises.length ? (masteredExercises / exercises.length) * 100 : 0);
        setSnapshot(mastery);
        setLoading(false);
      },
      error: (error) => {
        console.error('Failed to load analytics snapshot', error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const sortedLessons = useMemo(() => {
    if (!snapshot) return [] as LessonMasteryStat[];
    const entries = [...snapshot.lessonMastery];
    if (lessonSort === 'accuracy') {
      return entries.sort((a, b) => a.accuracy - b.accuracy);
    }
    return entries.sort((a, b) => {
      const aTime = a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0;
      const bTime = b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [lessonSort, snapshot]);

  const sortedSkills = useMemo(() => {
    if (!snapshot) return [] as SkillAccuracy[];
    const entries = [...snapshot.skillAccuracy];
    if (skillSort === 'volume') {
      return entries.sort((a, b) => b.total - a.total);
    }
    return entries.sort((a, b) => a.accuracy - b.accuracy);
  }, [skillSort, snapshot]);

  const handleExportLessons = () => {
    if (!snapshot) return;
    const rows = [
      ['Lesson', 'Mastered', 'Exercises', 'Accuracy %', 'Last studied'],
      ...snapshot.lessonMastery.map((entry) => [
        entry.lessonTitle,
        `${entry.masteredExercises}`,
        `${entry.totalExercises}`,
        entry.accuracy.toFixed(1),
        entry.lastAttemptAt ? new Date(entry.lastAttemptAt).toLocaleString() : 'Never',
      ]),
    ];
    downloadCsv('lesson-mastery.csv', rows);
  };

  const handleCopySummary = async () => {
    if (!snapshot) return;
    const summary = `Mastery: ${progress.toFixed(1)}%\nCurrent streak: ${snapshot.streak.current} days (best ${snapshot.streak.best})\nWeakest tag: ${snapshot.weakestTags[0]?.tag ?? 'N/A'}\nDue flashcards: ${snapshot.srs.dueNow}`;
    try {
      await navigator.clipboard.writeText(summary);
      // eslint-disable-next-line no-console
      console.info('Copied summary to clipboard');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Clipboard unavailable', error);
    }
  };

  if (loading) {
    return (
      <p role="status" className="ui-alert ui-alert--info">
        Loading analytics…
      </p>
    );
  }

  if (!snapshot) {
    return (
      <p role="status" className="ui-alert ui-alert--info">
        No data yet. Complete a few exercises to populate the dashboard.
      </p>
    );
  }

  return (
    <div className={styles.dashboard} aria-live="polite">
      <section className="ui-card ui-card--muted" aria-label="Mastery progress">
        <div className={styles.progressHeader}>
          <h2 className={styles.progressLabel}>Mastery progress</h2>
          <span className={styles.progressBadge}>{progress.toFixed(1)}% mastered</span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.progressValue} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className={styles.progressMeta}>
          <span>Average attempts to mastery: {snapshot.averageAttemptsToMastery.toFixed(2)}</span>
          <span>Current streak: {snapshot.streak.current} days (best {snapshot.streak.best})</span>
        </div>
        <div className={styles.actionsRow}>
          <button type="button" className="ui-button ui-button--secondary" onClick={handleExportLessons}>
            Export lesson CSV
          </button>
          <button type="button" className="ui-button ui-button--ghost" onClick={handleCopySummary}>
            Copy summary
          </button>
        </div>
      </section>

      <section className="ui-card" aria-label="Recent activity trend">
        <h3 className="ui-section__title">Activity streak and trend</h3>
        <div className={styles.activitySummary}>
          <p className={styles.activityMeta}>
            Last studied: {snapshot.streak.lastStudiedOn ? new Date(snapshot.streak.lastStudiedOn).toLocaleString() : 'No attempts yet'}
          </p>
          <div className={styles.sparkline} role="img" aria-label="Exercise attempts over the last 14 days">
            {snapshot.activityTrend.map((point) => {
              const ratio = point.total ? point.correct / point.total : 0;
              return (
                <div
                  key={point.date}
                  className={styles.sparklineBar}
                  style={{ height: `${Math.max(12, ratio * 100)}%` }}
                  title={formatActivityTooltip(point)}
                  data-active={point.total > 0}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="ui-card" aria-label="Lesson mastery table">
        <div className={styles.sectionHeader}>
          <h3 className="ui-section__title">Lesson mastery</h3>
          <div className={styles.sectionControls}>
            <button
              type="button"
              className={styles.sortButton}
              data-active={lessonSort === 'recent'}
              onClick={() => setLessonSort('recent')}
            >
              Sort by recency
            </button>
            <button
              type="button"
              className={styles.sortButton}
              data-active={lessonSort === 'accuracy'}
              onClick={() => setLessonSort('accuracy')}
            >
              Sort by accuracy
            </button>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className="ui-table" aria-label="Lesson mastery">
            <thead>
              <tr>
                <th>Lesson</th>
                <th>Mastered</th>
                <th>Accuracy</th>
                <th>Last studied</th>
              </tr>
            </thead>
            <tbody>
              {sortedLessons.map((lesson) => (
                <tr key={lesson.lessonId}>
                  <td>
                    {lesson.lessonSlug ? (
                      <Link to={`/lessons/${lesson.lessonSlug}`}>{lesson.lessonTitle}</Link>
                    ) : (
                      lesson.lessonTitle
                    )}
                  </td>
                  <td>
                    {lesson.masteredExercises}/{lesson.totalExercises}
                  </td>
                  <td>{lesson.accuracy.toFixed(1)}%</td>
                  <td>{formatLastStudied(lesson.lastAttemptAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ui-card" aria-label="Skill breakdown">
        <div className={styles.sectionHeader}>
          <h3 className="ui-section__title">Skill accuracy</h3>
          <div className={styles.sectionControls}>
            <button
              type="button"
              className={styles.sortButton}
              data-active={skillSort === 'accuracy'}
              onClick={() => setSkillSort('accuracy')}
            >
              Lowest accuracy
            </button>
            <button
              type="button"
              className={styles.sortButton}
              data-active={skillSort === 'volume'}
              onClick={() => setSkillSort('volume')}
            >
              Most attempts
            </button>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className="ui-table" aria-label="Skill accuracy">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Accuracy</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {sortedSkills.map((skill) => (
                <tr key={skill.skill}>
                  <td>{skill.skill}</td>
                  <td>{skill.accuracy.toFixed(1)}%</td>
                  <td>{skill.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ui-card" aria-label="Weakest tags">
        <h3 className="ui-section__title">Weakest tags</h3>
        {snapshot.weakestTags.length === 0 ? (
          <p className="ui-alert ui-alert--info">No accuracy data by tag yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className="ui-table" aria-label="Tags with lowest accuracy">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Accuracy</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.weakestTags.map((tag) => (
                  <tr key={tag.tag}>
                    <td>{tag.tag}</td>
                    <td>{tag.accuracy.toFixed(1)}%</td>
                    <td>{tag.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="ui-card" aria-label="SRS summary">
        <h3 className="ui-section__title">Spaced repetition load</h3>
        <div className={styles.srsGrid}>
          <div className={styles.srsTile}>
            <span className={styles.srsLabel}>Due now</span>
            <span className={styles.srsValue}>{snapshot.srs.dueNow}</span>
          </div>
          {snapshot.srs.upcoming.map((entry) => (
            <div key={entry.label} className={styles.srsTile}>
              <span className={styles.srsLabel}>{entry.label}</span>
              <span className={styles.srsValue}>{entry.count}</span>
            </div>
          ))}
        </div>
        <div className={styles.bucketList}>
          {snapshot.srs.bucketBreakdown.map((bucket) => (
            <span key={bucket.bucket} className={styles.bucketChip}>
              Bucket {bucket.bucket}: {bucket.due}/{bucket.total} due
            </span>
          ))}
        </div>
      </section>

      <section className="ui-card" aria-label="Recommended exercises">
        <h3 className="ui-section__title">Study plan (next five exercises)</h3>
        {snapshot.studyPlan.length === 0 ? (
          <p className="ui-alert ui-alert--info">
            All caught up! Import new lessons or revisit completed content.
          </p>
        ) : (
          <ol className={styles.studyList}>
            {snapshot.studyPlan.map((item) => (
              <li key={item.exerciseId}>
                <strong>{item.lessonTitle}</strong> – {item.reason}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="ui-card" aria-label="Time on task by lesson">
        <h3 className="ui-section__title">Time on task (per lesson)</h3>
        {snapshot.lessonTimes.length === 0 ? (
          <p className="ui-alert ui-alert--info">No lesson time logged yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className="ui-table" aria-label="Lesson time summary">
              <thead>
                <tr>
                  <th>Lesson</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.lessonTimes.map((lesson) => (
                  <tr key={lesson.lessonId}>
                    <td>{lesson.lessonTitle}</td>
                    <td>{formatDuration(lesson.totalMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

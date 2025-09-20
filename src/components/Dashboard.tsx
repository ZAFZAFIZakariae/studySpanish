import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { computeAnalytics, AnalyticsSnapshot } from '../lib/analytics';
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

export const Dashboard: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [lessons, exercises, grades] = await Promise.all([
        db.lessons.toArray(),
        db.exercises.toArray(),
        db.grades.toArray(),
      ]);
      const mastered = new Set(grades.filter((grade) => grade.isCorrect).map((grade) => grade.exerciseId));
      setProgress(exercises.length ? (mastered.size / exercises.length) * 100 : 0);
      setSnapshot(computeAnalytics(lessons, exercises, grades));
      setLoading(false);
    };
    load();
  }, []);

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
        <div className={styles.progressTrack} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressValue} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="ui-section__subtitle">
          Average attempts to mastery: {snapshot.averageAttemptsToMastery.toFixed(2)}
        </p>
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
    </div>
  );
};

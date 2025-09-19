import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { computeAnalytics, AnalyticsSnapshot } from '../lib/analytics';

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
    return <p role="status">Loading analytics…</p>;
  }

  if (!snapshot) {
    return <p role="status">No data yet. Complete a few exercises to populate the dashboard.</p>;
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <section className="space-y-2" aria-label="Mastery progress">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mastery progress</h2>
          <span className="text-sm text-gray-600">{progress.toFixed(1)}% mastered</span>
        </div>
        <div
          className="bg-gray-200 h-4 rounded"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bg-green-500 h-4 rounded" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-gray-600">
          Average attempts to mastery: {snapshot.averageAttemptsToMastery.toFixed(2)}
        </p>
      </section>

      <section className="space-y-2" aria-label="Time on task by lesson">
        <h3 className="text-lg font-semibold">Time on task (per lesson)</h3>
        {snapshot.lessonTimes.length === 0 ? (
          <p className="text-sm">No lesson time logged yet.</p>
        ) : (
          <table className="min-w-full border" aria-label="Lesson time summary">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Lesson</th>
                <th className="border px-3 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.lessonTimes.map((lesson) => (
                <tr key={lesson.lessonId}>
                  <td className="border px-3 py-1">{lesson.lessonTitle}</td>
                  <td className="border px-3 py-1">{formatDuration(lesson.totalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-2" aria-label="Weakest tags">
        <h3 className="text-lg font-semibold">Weakest tags</h3>
        {snapshot.weakestTags.length === 0 ? (
          <p className="text-sm">No accuracy data by tag yet.</p>
        ) : (
          <table className="min-w-full border" aria-label="Tags with lowest accuracy">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Tag</th>
                <th className="border px-3 py-2 text-left">Accuracy</th>
                <th className="border px-3 py-2 text-left">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.weakestTags.map((tag) => (
                <tr key={tag.tag}>
                  <td className="border px-3 py-1">{tag.tag}</td>
                  <td className="border px-3 py-1">{tag.accuracy.toFixed(1)}%</td>
                  <td className="border px-3 py-1">{tag.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-2" aria-label="Recommended exercises">
        <h3 className="text-lg font-semibold">Study plan (next five exercises)</h3>
        {snapshot.studyPlan.length === 0 ? (
          <p className="text-sm">All caught up! Import new lessons or revisit completed content.</p>
        ) : (
          <ol className="list-decimal ml-5 space-y-1 text-sm">
            {snapshot.studyPlan.map((item) => (
              <li key={item.exerciseId}>
                <span className="font-medium">{item.lessonTitle}</span> – {item.reason}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

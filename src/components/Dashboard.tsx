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
    return (
      <p role="status" className="rounded-xl border bg-white p-4 text-sm text-slate-600">
        Loading analytics…
      </p>
    );
  }

  if (!snapshot) {
    return (
      <p role="status" className="rounded-xl border bg-white p-4 text-sm text-slate-600">
        No data yet. Complete a few exercises to populate the dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <section className="space-y-3 rounded-xl border bg-white p-5 shadow-sm" aria-label="Mastery progress">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Mastery progress</h2>
          <span className="text-sm font-semibold text-emerald-700">{progress.toFixed(1)}% mastered</span>
        </div>
        <div
          className="h-4 rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-4 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-slate-600">
          Average attempts to mastery: {snapshot.averageAttemptsToMastery.toFixed(2)}
        </p>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5 shadow-sm" aria-label="Time on task by lesson">
        <h3 className="text-lg font-semibold text-slate-900">Time on task (per lesson)</h3>
        {snapshot.lessonTimes.length === 0 ? (
          <p className="text-sm text-slate-600">No lesson time logged yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm" aria-label="Lesson time summary">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Lesson</th>
                  <th className="px-3 py-2 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.lessonTimes.map((lesson) => (
                  <tr key={lesson.lessonId} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{lesson.lessonTitle}</td>
                    <td className="px-3 py-2 text-slate-700">{formatDuration(lesson.totalMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5 shadow-sm" aria-label="Weakest tags">
        <h3 className="text-lg font-semibold text-slate-900">Weakest tags</h3>
        {snapshot.weakestTags.length === 0 ? (
          <p className="text-sm text-slate-600">No accuracy data by tag yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-sm" aria-label="Tags with lowest accuracy">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tag</th>
                  <th className="px-3 py-2 font-semibold">Accuracy</th>
                  <th className="px-3 py-2 font-semibold">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.weakestTags.map((tag) => (
                  <tr key={tag.tag} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{tag.tag}</td>
                    <td className="px-3 py-2 text-slate-700">{tag.accuracy.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-slate-700">{tag.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-5 shadow-sm" aria-label="Recommended exercises">
        <h3 className="text-lg font-semibold text-slate-900">Study plan (next five exercises)</h3>
        {snapshot.studyPlan.length === 0 ? (
          <p className="text-sm text-slate-600">All caught up! Import new lessons or revisit completed content.</p>
        ) : (
          <ol className="ml-5 list-decimal space-y-1 text-sm text-slate-700">
            {snapshot.studyPlan.map((item) => (
              <li key={item.exerciseId}>
                <span className="font-semibold text-slate-900">{item.lessonTitle}</span> – {item.reason}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

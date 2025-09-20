import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db';
import { Exercise, Grade, Lesson } from '../lib/schemas';
import { LessonViewer } from '../components/LessonViewer';
import { ExerciseEngine } from '../components/ExerciseEngine';
import styles from './LessonPage.module.css';

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Not yet started';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Scheduled';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
};

const formatDuration = (ms: number) => {
  if (!ms) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
};

const getPromptPreview = (markdown: string) => {
  const stripped = markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*_>#-]/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return stripped[0] ?? 'Exercise prompt';
};

const LessonPage: React.FC = () => {
  const { slug } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [gradeHistory, setGradeHistory] = useState<Record<string, Grade[]>>({});
  const [sessionLog, setSessionLog] = useState<Grade[]>([]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setStatus('loading');
    setLesson(null);
    setExercises([]);
    setGradeHistory({});
    setSessionLog([]);
    const load = async () => {
      const found = await db.lessons.where('slug').equals(slug).first();
      if (!active) return;
      if (!found) {
        setStatus('missing');
        return;
      }
      const lessonExercises = await db.exercises.where('lessonId').equals(found.id).toArray();
      const exerciseIds = lessonExercises.map((exercise) => exercise.id);
      let grades: Grade[] = [];
      if (exerciseIds.length > 0) {
        grades = await db.grades.where('exerciseId').anyOf(exerciseIds).toArray();
      }
      if (!active) return;
      const grouped: Record<string, Grade[]> = {};
      grades.forEach((grade) => {
        const list = grouped[grade.exerciseId] ?? [];
        list.push(grade);
        grouped[grade.exerciseId] = list;
      });
      Object.values(grouped).forEach((list) =>
        list.sort((a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime())
      );
      setLesson(found);
      setExercises(lessonExercises);
      setGradeHistory(grouped);
      setStatus('ready');
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  );

  const lessonSummary = useMemo(() => {
    const totalExercises = exercises.length;
    let attempted = 0;
    let mastered = 0;
    let totalResponses = 0;
    let correctResponses = 0;
    let lastAttemptAt: string | undefined;

    exercises.forEach((exercise) => {
      const history = gradeHistory[exercise.id] ?? [];
      if (history.length > 0) {
        attempted += 1;
        const last = history[history.length - 1];
        if (!lastAttemptAt || new Date(last.gradedAt) > new Date(lastAttemptAt)) {
          lastAttemptAt = last.gradedAt;
        }
        if (last.isCorrect) mastered += 1;
        history.forEach((grade) => {
          totalResponses += 1;
          if (grade.isCorrect) correctResponses += 1;
        });
      }
    });

    const accuracy = totalResponses ? Math.round((correctResponses / totalResponses) * 100) : 0;

    return { totalExercises, attempted, mastered, accuracy, lastAttemptAt };
  }, [exercises, gradeHistory]);

  const exerciseSummaries = useMemo(() => {
    const map = new Map<
      string,
      { attempts: number; accuracy: number; lastAttemptAt?: string; mastered: boolean }
    >();
    exercises.forEach((exercise) => {
      const history = gradeHistory[exercise.id] ?? [];
      const attempts = history.length;
      const correct = history.filter((grade) => grade.isCorrect).length;
      const last = history[history.length - 1];
      map.set(exercise.id, {
        attempts,
        accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
        lastAttemptAt: last?.gradedAt,
        mastered: Boolean(last?.isCorrect),
      });
    });
    return map;
  }, [exercises, gradeHistory]);

  const sessionSummary = useMemo(() => {
    const attempts = sessionLog.length;
    const correct = sessionLog.filter((grade) => grade.isCorrect).length;
    const totalTime = sessionLog.reduce((total, grade) => total + (grade.timeMs ?? 0), 0);
    return { attempts, correct, totalTime };
  }, [sessionLog]);

  const recentSessionLog = useMemo(() => sessionLog.slice(0, 8), [sessionLog]);

  const handleGrade = (grade: Grade) => {
    setSessionLog((prev) => [grade, ...prev].slice(0, 12));
    setGradeHistory((prev) => {
      const next = { ...prev };
      const history = [...(next[grade.exerciseId] ?? []), grade];
      history.sort((a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime());
      next[grade.exerciseId] = history;
      return next;
    });
  };

  if (status === 'loading') {
    return (
      <p role="status" className="ui-alert ui-alert--info">
        Loading lesson…
      </p>
    );
  }

  if (status === 'missing' || !lesson) {
    return (
      <p role="alert" className="ui-alert ui-alert--danger">
        Lesson not found. Import the latest content drop to continue.
      </p>
    );
  }

  return (
    <article className={styles.page} aria-labelledby="lesson-title">
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <Link to="/" className="ui-button ui-button--ghost">
              ← Back to overview
            </Link>
            <span className="ui-chip">Level {lesson.level}</span>
          </div>
          <div>
            <h1 id="lesson-title" className="ui-section__title" style={{ color: '#f8fafc' }}>
              {lesson.title}
            </h1>
            <p className="ui-section__subtitle" style={{ color: 'rgba(241, 245, 249, 0.85)' }}>
              {lessonSummary.totalExercises > 0
                ? `${lessonSummary.totalExercises} practice activit${lessonSummary.totalExercises === 1 ? 'y' : 'ies'} ready · ${lessonSummary.mastered}/${lessonSummary.totalExercises} mastered on the latest attempt · Last reviewed ${formatRelativeTime(lessonSummary.lastAttemptAt)}.`
                : 'Review the notes, then import a practice set to track mastery.'}
            </p>
          </div>
          <div className={styles.heroTags} aria-label="Lesson tags">
            {lesson.tags.length > 0 ? (
              lesson.tags.map((tag) => (
                <span key={tag} className={styles.heroTag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className={styles.heroTag}>No tags yet</span>
            )}
          </div>
          <div className={styles.heroActions}>
            <a href="#lesson-exercises-heading" className="ui-button ui-button--primary">
              Jump to practise ↓
            </a>
            <Link to="/flashcards" className="ui-button ui-button--secondary">
              Start flashcard sprint →
            </Link>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainSections}>
          <section className={styles.lessonCard} aria-labelledby="lesson-content-heading">
            <h2 id="lesson-content-heading" className="ui-section__title">
              Lesson content
            </h2>
            <LessonViewer markdown={lesson.markdown} />
          </section>

          <section className={styles.lessonCard} aria-labelledby="lesson-exercises-heading">
            <div>
              <h2 id="lesson-exercises-heading" className="ui-section__title">
                Practise the lesson
              </h2>
              <p className="ui-section__subtitle">
                Work through each prompt to log attempts and unlock mastery progress.
              </p>
            </div>
            {lessonSummary.totalExercises > 0 && (
              <div className={styles.lessonMetrics} aria-label="Lesson progress summary">
                <div className={styles.lessonMetric}>
                  <span className={styles.lessonMetricLabel}>Mastered</span>
                  <span className={styles.lessonMetricValue}>
                    {lessonSummary.mastered}/{lessonSummary.totalExercises}
                  </span>
                </div>
                <div className={styles.lessonMetric}>
                  <span className={styles.lessonMetricLabel}>Attempted</span>
                  <span className={styles.lessonMetricValue}>
                    {lessonSummary.attempted}/{lessonSummary.totalExercises}
                  </span>
                </div>
                <div className={styles.lessonMetric}>
                  <span className={styles.lessonMetricLabel}>Accuracy</span>
                  <span className={styles.lessonMetricValue}>{lessonSummary.accuracy}%</span>
                </div>
                <div className={styles.lessonMetric}>
                  <span className={styles.lessonMetricLabel}>Last reviewed</span>
                  <span className={styles.lessonMetricValue}>
                    {formatRelativeTime(lessonSummary.lastAttemptAt)}
                  </span>
                </div>
              </div>
            )}
            {exercises.map((exercise) => {
              const summary = exerciseSummaries.get(exercise.id);
              const attempts = summary?.attempts ?? 0;
              const accuracy = summary ? `${summary.accuracy}% accuracy` : '0% accuracy';
              const lastReviewed = formatRelativeTime(summary?.lastAttemptAt);
              return (
                <div key={exercise.id} aria-label={`Exercise ${exercise.id}`}>
                  <div className={styles.exerciseSummary}>
                    <span>
                      {attempts} attempt{attempts === 1 ? '' : 's'} logged
                    </span>
                    <span>{accuracy}</span>
                    <span>{lastReviewed}</span>
                    {summary?.mastered ? (
                      <span className={styles.exerciseMastery}>Mastered</span>
                    ) : null}
                  </div>
                  <ExerciseEngine exercise={exercise} onGrade={handleGrade} />
                </div>
              );
            })}
            {exercises.length === 0 && (
              <p role="status" className="ui-alert ui-alert--info">
                No exercises found for this lesson yet.
              </p>
            )}
          </section>
        </div>

        <aside className={styles.sidebar} aria-label="Study guidance">
          <section className={styles.sidebarSection}>
            <span className="ui-section__tag">Session log</span>
            {recentSessionLog.length === 0 ? (
              <p className={styles.sidebarEmpty}>No attempts logged this session yet.</p>
            ) : (
              <>
                <p className={styles.sessionMeta}>
                  {sessionSummary.correct}/{sessionSummary.attempts} correct ·{' '}
                  {formatDuration(sessionSummary.totalTime)} on task
                </p>
                <ol className={styles.sessionList} aria-label="Latest attempts">
                  {recentSessionLog.map((entry) => {
                    const exercise = exerciseMap.get(entry.exerciseId);
                    const preview = exercise ? getPromptPreview(exercise.promptMd) : 'Exercise';
                    return (
                      <li key={entry.id} className={styles.sessionItem}>
                        <span className={styles.sessionBadge} data-correct={entry.isCorrect ? 'true' : 'false'}>
                          {entry.isCorrect ? 'Correct' : 'Retry'}
                        </span>
                        <span className={styles.sessionScore}>{Math.round(entry.score)}%</span>
                        <span className={styles.sessionTime}>{formatRelativeTime(entry.gradedAt)}</span>
                        <span className={styles.sessionPrompt}>{preview}</span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>
          <section className={styles.sidebarSection}>
            <span className="ui-section__tag">Study roadmap</span>
            <ol className={styles.sidebarList}>
              <li>Skim the key idea and underline new connectors or discourse markers.</li>
              <li>Complete the practice set, logging hints and timings for the dashboard.</li>
              <li>Finish with a flashcard sprint to reinforce the phrases you want to reuse.</li>
            </ol>
          </section>
          <section className={styles.sidebarSection}>
            <span className="ui-section__tag">Need a quick loop?</span>
            <p className="ui-section__subtitle">
              Jump to the flashcard trainer once you finish the exercises to cement new phrases.
            </p>
            <Link to="/flashcards" className="ui-button ui-button--secondary">
              Flashcard trainer ↗
            </Link>
          </section>
          {lesson.references?.length ? (
            <section className={styles.sidebarSection}>
              <span className="ui-section__tag">References</span>
              <ul className={styles.sidebarList}>
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

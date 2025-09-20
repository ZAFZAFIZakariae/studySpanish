import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db';
import { Exercise, Lesson } from '../lib/schemas';
import { LessonViewer } from '../components/LessonViewer';
import { ExerciseEngine } from '../components/ExerciseEngine';
import styles from './LessonPage.module.css';

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
              {exercises.length > 0
                ? `${exercises.length} practice activit${exercises.length === 1 ? 'y' : 'ies'} ready to log.`
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
            {exercises.map((exercise) => (
              <div key={exercise.id} aria-label={`Exercise ${exercise.id}`}>
                <ExerciseEngine exercise={exercise} />
              </div>
            ))}
            {exercises.length === 0 && (
              <p role="status" className="ui-alert ui-alert--info">
                No exercises found for this lesson yet.
              </p>
            )}
          </section>
        </div>

        <aside className={styles.sidebar} aria-label="Study guidance">
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

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Lesson } from '../lib/schemas';
import styles from './SpanishPage.module.css';

type LessonLevel = Lesson['level'];

const levelOrder: LessonLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const levelCopy: Record<LessonLevel, { title: string; description: string }> = {
  A1: {
    title: 'Level A1 · Essentials',
    description: 'Foundation lessons for greetings, introductions, and everyday basics.',
  },
  A2: {
    title: 'Level A2 · Conversations',
    description: 'Short dialogues, preferences, and day-to-day routines.',
  },
  B1: {
    title: 'Level B1 · Confident flow',
    description: 'Narrate past events and handle trickier grammar with guidance.',
  },
  B2: {
    title: 'Level B2 · Nuanced expression',
    description: 'Debate ideas, react to opinions, and polish intermediate gaps.',
  },
  C1: {
    title: 'Level C1 · Professional polish',
    description: 'Advanced tone control and specialist vocabulary practice.',
  },
  C2: {
    title: 'Level C2 · Mastery',
    description: 'Fine-tune idioms and stylistic choices for any audience.',
  },
};

type LoadState = 'loading' | 'ready' | 'empty';

const SpanishPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let active = true;
    const loadLessons = async () => {
      try {
        const allLessons = await db.lessons.toArray();
        if (!active) return;
        if (!allLessons.length) {
          setState('empty');
          return;
        }
        const sorted = [...allLessons].sort((a, b) => {
          const levelDiff = levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
          if (levelDiff !== 0) {
            return levelDiff;
          }
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
        });
        setLessons(sorted);
        setState('ready');
      } catch (error) {
        setState('empty');
      }
    };

    loadLessons();

    return () => {
      active = false;
    };
  }, []);

  const groupedByLevel = useMemo(() => {
    const map = new Map<LessonLevel, Lesson[]>(levelOrder.map((level) => [level, []]));
    lessons.forEach((lesson) => {
      const list = map.get(lesson.level) ?? [];
      list.push(lesson);
      map.set(lesson.level, list);
    });

    return levelOrder
      .map((level) => ({ level, lessons: (map.get(level) ?? []).slice() }))
      .filter((entry) => entry.lessons.length > 0);
  }, [lessons]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Spanish library</p>
        <h1 className={styles.title}>Choose a lesson to keep your Spanish moving</h1>
        <p className={styles.subtitle}>
          Lessons are grouped by CEFR level so you can review essentials or jump ahead to advanced practice.
        </p>
      </header>

      {state === 'loading' && <p className={styles.state}>Loading lessons…</p>}
      {state === 'empty' && (
        <p className={styles.state}>
          Lessons will appear here once your library is imported. Visit the content manager to sync your materials.
        </p>
      )}

      {state === 'ready' && (
        <div className={styles.levels}>
          {groupedByLevel.map(({ level, lessons: levelLessons }) => (
            <section key={level} className={styles.levelSection} aria-labelledby={`level-${level}`}>
              <header className={styles.levelHeader}>
                <h2 id={`level-${level}`} className={styles.levelTitle}>
                  {levelCopy[level].title}
                </h2>
                <p className={styles.levelDescription}>{levelCopy[level].description}</p>
              </header>
              <ul className={styles.lessonList}>
                {levelLessons.map((lesson) => (
                  <li key={lesson.id} className={styles.lessonItem}>
                    <Link to={`/lessons/${lesson.slug}`} className={styles.lessonLink}>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                      <span className={styles.lessonMeta}>
                        Level {lesson.level} · {lesson.tags.slice(0, 3).join(', ') || 'Spanish practice'}
                      </span>
                      <span className={styles.lessonArrow} aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpanishPage;

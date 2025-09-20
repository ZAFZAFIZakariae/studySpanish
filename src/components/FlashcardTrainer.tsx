import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { isDue, updateSRS } from '../lib/srs';
import { Flashcard } from '../lib/schemas';
import styles from './FlashcardTrainer.module.css';

export const FlashcardTrainer: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => {
    let active = true;
    db.flashcards.toArray().then((all) => {
      if (!active) return;
      const due = all.filter(isDue);
      setCards(due);
      setCurrent(due[0] ?? null);
      setShowBack(false);
      setTotalCards(due.length);
    });
    return () => {
      active = false;
    };
  }, []);

  const advance = useCallback((remaining: Flashcard[]) => {
    setCards(remaining);
    setCurrent(remaining[0] ?? null);
    setShowBack(false);
  }, []);

  const grade = useCallback(async (success: boolean) => {
    if (!current) return;
    const updated = updateSRS(current, success);
    await db.flashcards.put(updated);
    advance(cards.slice(1));
  }, [advance, cards, current]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!current) return;
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        setShowBack((prev) => !prev);
      }
      if (showBack && (event.key === 'ArrowRight' || event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        grade(true);
      }
      if (showBack && (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'j')) {
        event.preventDefault();
        grade(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, grade, showBack]);

  if (!current) {
    return (
      <section role="status" className={styles.emptyState}>
        <div className={styles.emptyHeader}>
          <span className={styles.emptyIcon} aria-hidden="true">
            🎉
          </span>
          <div>
            <h2 className="ui-section__title">You’re all caught up</h2>
            <p className="ui-section__subtitle">
              Import new cards or revisit mastered decks for a bonus review sprint.
            </p>
          </div>
        </div>
        <div className={styles.emptyActions}>
          <Link to="/content-manager">Import fresh flashcards ↗</Link>
          <Link to="/dashboard">Review progress →</Link>
        </div>
      </section>
    );
  }

  const remaining = cards.length;
  const completed = totalCards - remaining;
  const progress = totalCards > 0 ? Math.round((completed / totalCards) * 100) : 0;

  return (
    <section className={styles.trainer} aria-live="polite">
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.headerTag}>Session progress</span>
          <span className="ui-section__subtitle">
            {completed} of {totalCards} cards complete
          </span>
        </div>
        <span className={styles.headerStatus}>{remaining} left</span>
      </header>

      <div className={styles.cardSurface}>
        <span className={styles.promptLabel}>Prompt</span>
        <p className={styles.promptText} aria-label="Flashcard front">
          {current.front}
        </p>
        {showBack && (
          <div className={styles.answerSurface} aria-label="Flashcard back">
            {current.back}
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {!showBack ? (
          <button
            type="button"
            onClick={() => setShowBack(true)}
            className={styles.revealButton}
            aria-label="Reveal answer (spacebar)"
          >
            Reveal answer →
          </button>
        ) : (
          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={() => grade(true)}
              className={`${styles.gradeButton} ${styles.gradeSuccess}`}
              aria-label="I remembered it (arrow right or K)"
            >
              I knew it
            </button>
            <button
              type="button"
              onClick={() => grade(false)}
              className={`${styles.gradeButton} ${styles.gradeRetry}`}
              aria-label="I forgot (arrow left or J)"
            >
              I forgot
            </button>
          </div>
        )}

        <div className={styles.progress}>
          <div className="ui-section__subtitle">Progress {progress}%</div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCards > 0 ? (completed / totalCards) * 100 : 0}%` }}
            />
          </div>
        </div>

        <p className={styles.keyboardHint}>Space — reveal · J / ← — Forgot · K / → — Knew it</p>
      </div>
    </section>
  );
};

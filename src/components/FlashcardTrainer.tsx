import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { describeDueStatus, isDue, summarizeBuckets, updateSRS, ReviewGrade } from '../lib/srs';
import { Flashcard } from '../lib/schemas';
import styles from './FlashcardTrainer.module.css';

const sessionOptions = [
  { value: 10, label: '10 cards' },
  { value: 20, label: '20 cards' },
  { value: 0, label: 'All due cards' },
];

const gradeChoices: { grade: ReviewGrade; label: string; hotkey: string }[] = [
  { grade: 'again', label: 'Again', hotkey: '1' },
  { grade: 'hard', label: 'Hard', hotkey: '2' },
  { grade: 'good', label: 'Good', hotkey: '3' },
  { grade: 'easy', label: 'Easy', hotkey: '4' },
];

interface TrainerStats {
  dueTotal: number;
  buckets: ReturnType<typeof summarizeBuckets>;
}

const computeStats = (cards: Flashcard[]): TrainerStats => ({
  dueTotal: cards.filter(isDue).length,
  buckets: summarizeBuckets(cards),
});

const sortByDue = (cards: Flashcard[]) =>
  [...cards].sort((a, b) => {
    const aDue = a.srs?.nextDue ? new Date(a.srs.nextDue).getTime() : 0;
    const bDue = b.srs?.nextDue ? new Date(b.srs.nextDue).getTime() : 0;
    return aDue - bDue;
  });

export const FlashcardTrainer: React.FC = () => {
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [deckFilter, setDeckFilter] = useState<'all' | Flashcard['deck']>('all');
  const [tagFilter, setTagFilter] = useState<'all' | string>('all');
  const [sessionLength, setSessionLength] = useState<number>(20);
  const [totalCards, setTotalCards] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [skipRebuild, setSkipRebuild] = useState(false);
  const [stats, setStats] = useState<TrainerStats>({ dueTotal: 0, buckets: [] });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const cards = await db.flashcards.toArray();
      if (!active) return;
      setAllCards(cards);
      setStats(computeStats(cards));
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const deckOptions = useMemo(() => {
    const entries = new Set<Flashcard['deck']>();
    allCards.forEach((card) => entries.add(card.deck));
    return Array.from(entries.values());
  }, [allCards]);

  const tagOptions = useMemo(() => {
    const entries = new Set<string>();
    allCards.forEach((card) => entries.add(card.tag));
    return Array.from(entries.values()).sort((a, b) => a.localeCompare(b));
  }, [allCards]);

  const buildQueue = useCallback(
    (source: Flashcard[], resetProgress: boolean) => {
      const byDeck = deckFilter === 'all' ? source : source.filter((card) => card.deck === deckFilter);
      const byTag = tagFilter === 'all' ? byDeck : byDeck.filter((card) => card.tag === tagFilter);
      const dueCards = sortByDue(byTag.filter(isDue));
      const pool = dueCards.length ? dueCards : sortByDue(byTag);
      const limit = sessionLength > 0 ? sessionLength : pool.length;
      const nextQueue = pool.slice(0, limit);
      setQueue(nextQueue);
      setCurrent(nextQueue[0] ?? null);
      setShowBack(false);
      if (resetProgress) {
        setCompleted(0);
        setTotalCards(nextQueue.length);
      } else {
        setTotalCards((prev) => Math.max(prev, nextQueue.length + completed));
      }
    },
    [deckFilter, tagFilter, sessionLength, completed]
  );

  useEffect(() => {
    if (skipRebuild) {
      setSkipRebuild(false);
      return;
    }
    buildQueue(allCards, true);
  }, [allCards, deckFilter, tagFilter, sessionLength, skipRebuild, buildQueue]);

  const progress = totalCards > 0 ? Math.round((completed / totalCards) * 100) : 0;

  const gradeCard = useCallback(
    async (grade: ReviewGrade) => {
      if (!current) return;
      const updated = updateSRS(current, grade);
      await db.flashcards.put(updated);
      setSkipRebuild(true);
      setQueue((prev) => {
        const nextQueue = prev.slice(1);
        setCurrent(nextQueue[0] ?? null);
        return nextQueue;
      });
      setCompleted((prev) => prev + 1);
      setShowBack(false);
      setAllCards((prev) => {
        const next = prev.map((card) => (card.id === updated.id ? updated : card));
        setStats(computeStats(next));
        return next;
      });
    },
    [current]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!current) return;
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        setShowBack((prev) => !prev);
        return;
      }
      if (!showBack) return;
      const keyMap: Record<string, ReviewGrade> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
        ArrowLeft: 'hard',
        ArrowRight: 'good',
        ArrowDown: 'again',
        ArrowUp: 'easy',
      };
      const grade = keyMap[event.key];
      if (grade) {
        event.preventDefault();
        gradeCard(grade);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, gradeCard, showBack]);

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

  const deckBreakdown = stats.buckets.filter((bucket) => bucket.total > 0);

  return (
    <section className={styles.trainer} aria-live="polite">
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.headerTag}>Session progress</span>
          <span className="ui-section__subtitle">
            {completed} of {totalCards} cards complete
          </span>
          <div className={styles.deckStats}>
            Due total: {stats.dueTotal}
          </div>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Deck
            <select
              value={deckFilter}
              onChange={(event) => setDeckFilter(event.target.value as typeof deckFilter)}
            >
              <option value="all">All decks</option>
              {deckOptions.map((deck) => (
                <option key={deck} value={deck}>
                  {deck}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.controlLabel}>
            Tag
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value as typeof tagFilter)}
            >
              <option value="all">All tags</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.controlLabel}>
            Session length
            <select
              value={sessionLength}
              onChange={(event) => setSessionLength(Number(event.target.value))}
            >
              {sessionOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className={styles.cardSurface}>
        <span className={styles.promptLabel}>Prompt</span>
        <p className={styles.promptText} aria-label="Flashcard front">
          {current.front}
        </p>
        <div className={styles.cardMeta}>
          <span>{current.deck}</span>
          <span>{current.tag}</span>
          <span>{describeDueStatus(current)}</span>
        </div>
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
            {gradeChoices.map((choice) => (
              <button
                key={choice.grade}
                type="button"
                onClick={() => gradeCard(choice.grade)}
                className={`${styles.gradeButton} ${styles[`grade${choice.grade[0].toUpperCase()}${choice.grade.slice(1)}`] ?? ''}`}
                aria-label={`${choice.label} (hotkey ${choice.hotkey})`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.progress}>
          <div className="ui-section__subtitle">Progress {progress}%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <p className={styles.keyboardHint}>
          Space — reveal · 1 Again · 2 Hard · 3 Good · 4 Easy · Arrows also grade
        </p>
      </div>

      {deckBreakdown.length > 0 && (
        <div className={styles.bucketSummary}>
          {deckBreakdown.map((bucket) => (
            <span key={bucket.bucket} className={styles.bucketChip}>
              Bucket {bucket.bucket}: {bucket.due}/{bucket.total}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

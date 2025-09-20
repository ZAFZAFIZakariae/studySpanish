import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { isDue, updateSRS } from '../lib/srs';
import { Flashcard } from '../lib/schemas';

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
      <section
        role="status"
        className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-100 via-white to-emerald-50 p-8 text-emerald-900 shadow-lg"
      >
        <div className="absolute inset-y-0 right-[-140px] h-[320px] w-[320px] rounded-full bg-emerald-300/40 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl">🎉</span>
            <div>
              <h2 className="text-2xl font-semibold">You’re all caught up</h2>
              <p className="text-sm text-emerald-700">
                Import new cards or revisit mastered decks for a bonus review sprint.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/content-manager"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 focus-visible:ring"
            >
              Import fresh flashcards
              <span aria-hidden="true">↗</span>
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 focus-visible:ring"
            >
              Review progress
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const remaining = cards.length;
  const completed = totalCards - remaining;
  const progress = totalCards > 0 ? Math.round((completed / totalCards) * 100) : 0;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-white/90 p-8 shadow-xl shadow-blue-100/50 backdrop-blur"
      aria-live="polite"
    >
      <div className="absolute inset-y-0 -right-24 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Session progress</p>
            <p className="text-sm text-slate-600" aria-live="polite">
              {completed} of {totalCards} cards complete
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            {remaining} left
          </span>
        </header>

        <div className="space-y-5">
          <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-white via-blue-50 to-white p-6 shadow-inner">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Prompt</span>
            <p className="mt-4 text-2xl font-bold leading-snug text-slate-900" aria-label="Flashcard front">
              {current.front}
            </p>
            {showBack && (
              <div className="mt-6 rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">Answer</span>
                <p className="mt-2 text-lg font-semibold leading-relaxed text-emerald-700" aria-label="Flashcard back">
                  {current.back}
                </p>
              </div>
            )}
          </div>

          {!showBack ? (
            <button
              type="button"
              onClick={() => setShowBack(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 focus-visible:ring"
              aria-label="Reveal answer (spacebar)"
            >
              Reveal answer
              <span aria-hidden="true" className="text-base">
                →
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => grade(true)}
                className="flex-1 rounded-full border border-emerald-300 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:ring"
                aria-label="I remembered it (arrow right or K)"
              >
                I knew it
              </button>
              <button
                type="button"
                onClick={() => grade(false)}
                className="flex-1 rounded-full border border-rose-200 bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 focus-visible:ring"
                aria-label="I forgot (arrow left or J)"
              >
                I forgot
              </button>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${totalCards > 0 ? (completed / totalCards) * 100 : 0}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Space — reveal · J / ← — Forgot · K / → — Knew it
          </p>
        </div>
      </div>
    </section>
  );
};

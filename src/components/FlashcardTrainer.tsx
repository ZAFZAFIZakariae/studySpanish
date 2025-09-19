import React, { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import { isDue, updateSRS } from '../lib/srs';
import { Flashcard } from '../lib/schemas';

export const FlashcardTrainer: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    let active = true;
    db.flashcards.toArray().then((all) => {
      if (!active) return;
      const due = all.filter(isDue);
      setCards(due);
      setCurrent(due[0] ?? null);
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
      <div role="status" className="p-4 border rounded bg-green-50">
        No due cards 🎉
      </div>
    );
  }

  return (
    <div className="p-4 border rounded shadow-sm space-y-3" aria-live="polite">
      <div>
        <p className="text-sm text-gray-500" aria-label="Remaining cards">
          {cards.length} cards in session
        </p>
        <div className="text-lg font-semibold" aria-label="Flashcard front">
          {current.front}
        </div>
      </div>
      {showBack ? (
        <div className="mt-2 text-green-600" aria-label="Flashcard back">
          {current.back}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowBack(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded focus-visible:ring"
          aria-label="Reveal answer (spacebar)"
        >
          Show answer
        </button>
      )}
      {showBack && (
        <div className="flex gap-2 mt-2" role="group" aria-label="Grade your recall">
          <button
            type="button"
            onClick={() => grade(true)}
            className="bg-green-600 text-white px-4 py-2 rounded focus-visible:ring"
            aria-label="I remembered it (arrow right or K)"
          >
            I knew it
          </button>
          <button
            type="button"
            onClick={() => grade(false)}
            className="bg-red-600 text-white px-4 py-2 rounded focus-visible:ring"
            aria-label="I forgot (arrow left or J)"
          >
            I forgot
          </button>
        </div>
      )}
    </div>
  );
};

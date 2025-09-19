import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { isDue, updateSRS } from '../lib/srs';
import { Flashcard } from '../lib/schemas';

export const FlashcardTrainer: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    db.flashcards.toArray().then(all => {
      const due = all.filter(isDue);
      setCards(due);
      setCurrent(due[0] ?? null);
    });
  }, []);

  const grade = async (success: boolean) => {
    if (!current) return;
    const updated = updateSRS(current, success);
    await db.flashcards.put(updated);
    const next = cards.slice(1);
    setCards(next);
    setCurrent(next[0] ?? null);
    setShowBack(false);
  };

  if (!current) return <div>No due cards 🎉</div>;

  return (
    <div className="p-4 border rounded shadow">
      <div>{current.front}</div>
      {showBack && <div className="mt-2 text-green-600">{current.back}</div>}
      {!showBack && <button onClick={() => setShowBack(true)}>Show Answer</button>}
      {showBack && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => grade(true)} className="bg-green-500 text-white px-2">I knew it</button>
          <button onClick={() => grade(false)} className="bg-red-500 text-white px-2">I forgot</button>
        </div>
      )}
    </div>
  );
};

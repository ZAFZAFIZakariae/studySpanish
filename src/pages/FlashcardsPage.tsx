import React from 'react';
import { Link } from 'react-router-dom';
import { FlashcardTrainer } from '../components/FlashcardTrainer';

const FlashcardsPage: React.FC = () => (
  <section className="space-y-6" aria-labelledby="flashcards-heading">
    <header className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Spaced repetition</p>
      <h1 id="flashcards-heading" className="text-3xl font-bold text-slate-900">
        Flashcard trainer
      </h1>
      <p className="text-sm text-slate-600">
        Keep verbs, connectors, and presentation phrases ready. Flip cards with the spacebar and grade your recall
        with J/K (or the arrow keys) to move quickly.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
          ← Back to overview
        </Link>
        <Link to="/content-manager" className="text-sm font-semibold text-blue-700 underline focus-visible:ring">
          Import new flashcards
        </Link>
      </div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <FlashcardTrainer />
      <aside className="space-y-4 rounded-xl border bg-white p-4 shadow-sm" aria-label="Trainer tips">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Keyboard flow</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-800">Space</span> — Reveal the back.
            </li>
            <li>
              <span className="font-semibold text-slate-800">J / ←</span> — Mark as “I forgot”.
            </li>
            <li>
              <span className="font-semibold text-slate-800">K / →</span> — Mark as “I knew it”.
            </li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Best practice</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Say each answer aloud to build confident speaking reflexes.</li>
            <li>Mix in a quick dashboard review if you clear the due pile.</li>
            <li>
              Rotate between decks—verbs, grammar, vocab, presentations—to keep coverage balanced.
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
);

export default FlashcardsPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { FlashcardTrainer } from '../components/FlashcardTrainer';
import styles from './FlashcardsPage.module.css';

const FlashcardsPage: React.FC = () => (
  <section className={styles.page} aria-labelledby="flashcards-heading">
    <header className={`ui-card ui-card--strong ${styles.header}`}>
      <span className="ui-section__tag">Spaced repetition</span>
      <h1 id="flashcards-heading" className="ui-section__title">
        Flashcard trainer
      </h1>
      <p className="ui-section__subtitle">
        Keep verbs, connectors, and presentation phrases ready. Flip cards with the spacebar and grade each recall with the number keys or arrows to log Again, Hard, Good, or Easy in one motion.
      </p>
      <div className="ui-pill-group">
        <Link to="/" className="ui-button ui-button--ghost">
          ← Back to overview
        </Link>
        <Link to="/content-manager" className="ui-button ui-button--secondary">
          Import new flashcards →
        </Link>
      </div>
    </header>

    <div className={styles.layout}>
      <FlashcardTrainer />
      <aside className={`${styles.sidebar}`} aria-label="Trainer tips">
        <section className="ui-card ui-card--muted">
          <span className="ui-section__tag">Keyboard flow</span>
          <ul className="ui-section">
            <li>
              <strong>Space</strong> — Reveal the back.
            </li>
            <li>
              <strong>1 / ↓</strong> — Mark as “Again” and relearn soon.
            </li>
            <li>
              <strong>2 / ←</strong> — Mark as “Hard” to shorten the next interval.
            </li>
            <li>
              <strong>3 / →</strong> — Mark as “Good” when the recall felt solid.
            </li>
            <li>
              <strong>4 / ↑</strong> — Mark as “Easy” to push the card further out.
            </li>
          </ul>
        </section>
        <section className="ui-card ui-card--muted">
          <span className="ui-section__tag">Best practice</span>
          <ul className="ui-section">
            <li>Say each answer aloud to build confident speaking reflexes.</li>
            <li>Mix in a quick dashboard review if you clear the due pile.</li>
            <li>Rotate between decks to keep coverage balanced.</li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
);

export default FlashcardsPage;

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

const HomePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Start learning</p>
        <h1 className={styles.title}>What would you like to study today?</h1>
        <p className={styles.subtitle}>
          Pick a path to jump straight into your next study session.
        </p>
      </header>

      <div className={styles.options}>
        <Link to="/spanish" className={styles.optionCard}>
          <span className={styles.optionIcon} aria-hidden="true">
            🗣️
          </span>
          <h2 className={styles.optionTitle}>Study Spanish</h2>
          <p className={styles.optionDescription}>
            Browse lessons organised by level and keep your language practice moving forward.
          </p>
        </Link>

        <Link to="/subjects" className={styles.optionCard}>
          <span className={styles.optionIcon} aria-hidden="true">
            📚
          </span>
          <h2 className={styles.optionTitle}>Explore subjects</h2>
          <p className={styles.optionDescription}>
            Review materials from your other courses and pick the next topic to tackle.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;

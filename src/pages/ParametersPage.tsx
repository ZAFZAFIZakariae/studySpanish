import React from 'react';
import { Link } from 'react-router-dom';
import { useFocusMode } from '../contexts/FocusModeContext';
import styles from './ParametersPage.module.css';

const featureLinks = [
  {
    to: '/dashboard',
    title: 'Insights',
    description: 'View streaks, accuracy trends, and other study analytics.',
    icon: '📈',
  },
  {
    to: '/flashcards',
    title: 'Flashcards',
    description: 'Jump into spaced repetition to reinforce vocabulary and grammar.',
    icon: '🧠',
  },
  {
    to: '/content-manager',
    title: 'Content manager',
    description: 'Sync imported lessons or add new material to your library.',
    icon: '🛠️',
  },
];

const ParametersPage: React.FC = () => {
  const { focusMode, toggleFocusMode } = useFocusMode();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Parameters</p>
        <h1 className={styles.title}>Control your study extras</h1>
        <p className={styles.subtitle}>
          Adjust focus mode or open supporting tools like insights and flashcards from this hub.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="focus-settings">
        <h2 id="focus-settings" className={styles.sectionTitle}>
          Focus preferences
        </h2>
        <p className={styles.sectionDescription}>
          Focus mode streamlines the interface so you can work through a single lesson without distractions.
        </p>
        <button type="button" className={styles.focusToggle} onClick={toggleFocusMode}>
          <span className={styles.focusIcon} aria-hidden="true">
            {focusMode ? '🎧' : '🎯'}
          </span>
          <span className={styles.focusText}>
            Focus mode is <strong>{focusMode ? 'on' : 'off'}</strong>
          </span>
        </button>
      </section>

      <section className={styles.section} aria-labelledby="extra-tools">
        <h2 id="extra-tools" className={styles.sectionTitle}>
          Extra study tools
        </h2>
        <div className={styles.toolGrid}>
          {featureLinks.map((feature) => (
            <Link key={feature.to} to={feature.to} className={styles.toolCard}>
              <span className={styles.toolIcon} aria-hidden="true">
                {feature.icon}
              </span>
              <span className={styles.toolContent}>
                <span className={styles.toolTitle}>{feature.title}</span>
                <span className={styles.toolDescription}>{feature.description}</span>
              </span>
              <span className={styles.toolArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ParametersPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => (
  <section className={styles.page} aria-labelledby="dashboard-page-heading">
    <header className={`ui-card ui-card--strong ${styles.pageHeader}`}>
      <span className="ui-section__tag">Analytics</span>
      <h1 id="dashboard-page-heading" className="ui-section__title">
        Progress dashboard
      </h1>
      <p className="ui-section__subtitle">
        Review accuracy, speed, and recommended exercises after each session so you can adjust the next study block with confidence.
      </p>
      <div className={styles.headerActions}>
        <Link to="/" className="ui-button ui-button--ghost">
          ← Back to overview
        </Link>
        <Link to="/flashcards" className="ui-button ui-button--secondary">
          Drill due flashcards →
        </Link>
      </div>
    </header>
    <Dashboard />
  </section>
);

export default DashboardPage;

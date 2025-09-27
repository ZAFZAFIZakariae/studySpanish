import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePlannerActions } from '../../hooks/usePlannerActions';
import styles from './AppShell.module.css';

interface AppShellProps {
  highContrastEnabled: boolean;
  onToggleHighContrast: () => void;
  children: React.ReactNode;
}

type NavigationItem = {
  to: string;
  label: string;
  description: string;
  icon: string;
  exact?: boolean;
};

const navigation: NavigationItem[] = [
  {
    to: '/',
    label: 'Planner',
    description: 'Your personalised hub',
    icon: '🗓️',
    exact: true,
  },
  {
    to: '/subjects',
    label: 'Subjects',
    description: 'Courses, labs & translations',
    icon: '📚',
  },
  {
    to: '/dashboard',
    label: 'Insights',
    description: 'Progress analytics',
    icon: '📈',
  },
  {
    to: '/flashcards',
    label: 'Review',
    description: 'Spaced repetition trainer',
    icon: '🧠',
  },
  {
    to: '/content-manager',
    label: 'Creator mode',
    description: 'Manage imported lessons',
    icon: '🛠️',
  },
];

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  const [focusMode, setFocusMode] = useState(false);
  const location = useLocation();
  const { commandItems } = usePlannerActions();

  const mainClassName = [
    styles.main,
    focusMode ? styles.mainFocused : '',
    location.pathname.startsWith('/lessons') ? styles.mainLesson : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.appShell} data-focus-mode={focusMode ? 'on' : 'off'}>
      <div className={styles.backdrop} aria-hidden="true" />
      <header className={styles.header} aria-label="Primary navigation">
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            SC
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Study Compass</span>
            <span className={styles.brandTagline}>Plan · Translate · Excel</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Main sections">
          {navigation.map(({ to, label, icon, exact, description }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
              }
              title={description ?? label}
              aria-label={description ?? label}
            >
              <span className={styles.navIcon} aria-hidden="true">
                {icon}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.actionButton} ${focusMode ? styles.actionButtonActive : ''}`}
            aria-pressed={focusMode}
            onClick={() => setFocusMode((prev) => !prev)}
            title="Toggle focus mode"
            data-role="focus"
          >
            <span className={styles.actionIcon} aria-hidden="true">
              {focusMode ? '🎧' : '🎯'}
            </span>
            <span className={styles.actionLabel}>Focus {focusMode ? 'on' : 'off'}</span>
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${highContrastEnabled ? styles.actionButtonActive : ''}`}
            aria-pressed={highContrastEnabled}
            onClick={onToggleHighContrast}
            title="Toggle high-contrast theme"
          >
            <span className={styles.actionIcon} aria-hidden="true">
              {highContrastEnabled ? '🌙' : '🌞'}
            </span>
            <span className={styles.actionLabel}>
              {highContrastEnabled ? 'High contrast' : 'Standard'}
            </span>
          </button>
        </div>
      </header>

      <section className={styles.commandBar} aria-label="Personalised quick actions">
        <div className={styles.commandHeader}>
          <p className={styles.commandTitle}>Focus for today</p>
          <p className={styles.commandSubtitle}>
            Pick a block to jump straight into a win.
          </p>
        </div>
        <div className={styles.commandList} role="list" aria-live="polite">
          {commandItems.map(({ key, to, label, hint, icon, badge, disabled }) => {
            const content = (
              <>
                <span className={styles.commandIcon} aria-hidden="true">
                  {icon}
                </span>
                <span className={styles.commandText}>
                  <span className={styles.commandLabel}>{label}</span>
                  <span className={styles.commandHint}>{hint}</span>
                </span>
                <span className={styles.commandMeta}>
                  {badge && <span className={styles.commandBadge}>{badge}</span>}
                  <span className={styles.commandArrow} aria-hidden="true">
                    →
                  </span>
                </span>
              </>
            );

            if (disabled || !to) {
              return (
                <div key={key} className={`${styles.commandCard} ${styles.commandCardDisabled}`} role="listitem">
                  {content}
                </div>
              );
            }

            return (
              <Link key={key} to={to} className={styles.commandCard} role="listitem">
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <main id="main-content" tabIndex={-1} className={mainClassName}>
        <div className={styles.mainInner}>{children}</div>
      </main>

      <footer className={styles.footer} aria-label="Site footer">
        <p>
          Curious what’s new? Browse the <a href="/docs/changelog.md">changelog</a> or sync the latest bundle in the content
          manager.
        </p>
      </footer>
    </div>
  );
};

export default AppShell;

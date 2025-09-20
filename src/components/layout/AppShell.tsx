import React, { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
    label: 'Overview',
    description: 'Plan the next study block at a glance.',
    icon: '🧭',
    exact: true,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Progress analytics and weak spots.',
    icon: '📊',
  },
  {
    to: '/flashcards',
    label: 'Flashcards',
    description: 'Spaced repetition trainer.',
    icon: '🧠',
  },
  {
    to: '/content-manager',
    label: 'Content manager',
    description: 'Import JSON lesson bundles.',
    icon: '📁',
  },
];

const quickActions: NavigationItem[] = [
  {
    to: '/dashboard',
    label: 'Review analytics',
    description: 'Start with the weakest skills and tags.',
    icon: '📈',
  },
  {
    to: '/flashcards',
    label: 'Warm-up with flashcards',
    description: 'Clear due connectors in five focused minutes.',
    icon: '⚡️',
  },
  {
    to: '/content-manager',
    label: 'Refresh content bundle',
    description: 'Import the latest JSON drop before you begin.',
    icon: '🔄',
  },
];

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  const [focusMode, setFocusMode] = useState(false);

  const mainContent = useMemo(
    () => (focusMode ? <div className={styles.mainActive}>{children}</div> : children),
    [children, focusMode]
  );

  return (
    <div className={styles.appShell}>
      <div className={styles.background} aria-hidden="true" />
      <div className="ui-max-width">
        <div className={styles.inner}>
          <header className={styles.header} aria-label="Primary navigation">
            <div className={styles.headerBar}>
              <div className={styles.brand}>
                <Link to="/" className={styles.logo}>
                  Study Spanish Coach
                </Link>
                <p className={styles.tagline}>
                  Daily Spanish sprints, analytics and flashcards in a social-inspired dashboard.
                </p>
              </div>
              <div className={styles.headerActions}>
                <div className={styles.flowPill} aria-hidden="true">
                  <span>Plan</span>
                  <span>Practice</span>
                  <span>Reflect</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={highContrastEnabled}
                  onClick={onToggleHighContrast}
                  className={styles.contrastToggle}
                  data-active={highContrastEnabled}
                  aria-label="Toggle high-contrast theme"
                >
                  <span className={styles.toggleThumb} aria-hidden="true">
                    {highContrastEnabled ? 'HC' : 'Aa'}
                  </span>
                  <span className={styles.toggleLabels}>
                    <span>Light</span>
                    <span>Contrast</span>
                  </span>
                </button>
              </div>
            </div>
            <nav className={styles.nav} aria-label="Primary sections">
              <ul className={styles.navList}>
                {navigation.map(({ to, label, description, exact, icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={exact}
                      className={({ isActive }) =>
                        [styles.navLink, isActive ? styles.navLinkActive : '']
                          .filter(Boolean)
                          .join(' ')
                      }
                    >
                      <span className={styles.navIcon} aria-hidden="true">
                        {icon}
                      </span>
                      <span className={styles.navText}>
                        <span className={styles.navLabel}>{label}</span>
                        <span className={styles.navHint}>{description}</span>
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <div className={styles.layout}>
            <aside className={styles.sidebar} aria-label="Session planner">
              <section className={`ui-card ui-card--strong ${styles.sessionPlanner}`}>
                <header className="ui-section">
                  <span className="ui-section__tag">Session planner</span>
                  <span className="ui-section__subtitle">
                    Map out the next study sprint with curated shortcuts.
                  </span>
                </header>
                <div className={styles.quickActions} role="list">
                  {quickActions.map(({ to, label, description, icon }) => (
                    <Link key={to} to={to} className={styles.quickLink} role="listitem">
                      <span className={styles.quickLinkText}>
                        <span className={styles.quickLinkLabel}>{label}</span>
                        <span className={styles.quickLinkDescription}>{description}</span>
                      </span>
                      <span className={styles.quickLinkIcon} aria-hidden="true">
                        {icon}
                      </span>
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={focusMode}
                  onClick={() => setFocusMode((prev) => !prev)}
                  className={styles.focusToggle}
                  data-active={focusMode}
                >
                  {focusMode ? 'Focus mode enabled' : 'Enable focus mode'}
                </button>
              </section>

              <section className="ui-card ui-card--muted">
                <span className="ui-section__tag">Navigation highlights</span>
                <p className="ui-section__subtitle">
                  Each page is optimised for one step of your bilingual workflow — pin this panel if you need a reminder.
                </p>
                <ul className="ui-section" role="list">
                  <li>
                    <strong>Overview:</strong> plan what to learn next.
                  </li>
                  <li>
                    <strong>Dashboard:</strong> inspect accuracy trends.
                  </li>
                  <li>
                    <strong>Flashcards:</strong> reinforce quick wins.
                  </li>
                  <li>
                    <strong>Content:</strong> keep lessons synced offline.
                  </li>
                </ul>
              </section>
            </aside>

            <main id="main-content" tabIndex={-1} className={styles.main}>
              {mainContent}
            </main>

            <aside className={styles.sidebar} aria-label="Study tips">
              <section className="ui-card ui-card--muted">
                <span className="ui-section__tag">Session checklist</span>
                <ol className="ui-section" aria-label="Study session checklist">
                  <li>
                    <strong>Review metrics.</strong>{' '}
                    <Link to="/dashboard">Open the dashboard</Link> to choose a focus tag.
                  </li>
                  <li>
                    <strong>Work through one lesson.</strong> Skim the overview below and pick the next item in your queue.
                  </li>
                  <li>
                    <strong>Reinforce with flashcards.</strong>{' '}
                    <Link to="/flashcards">Run the due deck</Link> to lock it in.
                  </li>
                </ol>
              </section>

              <section className="ui-card ui-card--muted">
                <span className="ui-section__tag">Keep content fresh</span>
                <p className="ui-section__subtitle">
                  Import JSON bundles in the content manager to refresh lessons and practise sets. Once loaded, everything is cached for offline work.
                </p>
                <Link to="/content-manager" className="ui-button ui-button--secondary">
                  Go to content manager
                </Link>
              </section>
            </aside>
          </div>

          <footer className={styles.footer} aria-label="Site footer">
            Launch locally with <code>npm install</code> then <code>npm run dev</code>.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AppShell;

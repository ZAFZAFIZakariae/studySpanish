import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspaceSnapshot } from '../../hooks/useWorkspaceSnapshot';
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

type QuickAction = {
  to: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
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

const deckLabel = (deck: string) => {
  switch (deck) {
    case 'verbs':
      return 'Verb drills';
    case 'vocab':
      return 'Vocabulary';
    case 'presentations':
      return 'Presentation phrases';
    case 'grammar':
    default:
      return 'Grammar focus';
  }
};

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Never';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return 'Just now';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
};

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  const [focusMode, setFocusMode] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  const workspace = useWorkspaceSnapshot();

  useEffect(() => {
    setSearchTerm(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    else params.delete('q');
    const searchString = params.toString();
    navigate(`/${searchString ? `?${searchString}` : ''}#lesson-library`);
  };

  const mainContent = useMemo(
    () => (
      <div
        className={[
          styles.mainCanvas,
          focusMode ? styles.mainCanvasFocused : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    ),
    [children, focusMode]
  );

  const quickActions: QuickAction[] = useMemo(() => {
    if (workspace.loading) {
      return [
        {
          to: '/',
          label: 'Loading workspace insights…',
          description: 'We’re gathering lessons, flashcards and analytics.',
          icon: '⏳',
        },
      ];
    }

    const actions: QuickAction[] = [];

    if (workspace.resumeLesson) {
      actions.push({
        to: workspace.resumeLesson.lessonSlug
          ? `/lessons/${workspace.resumeLesson.lessonSlug}`
          : '/',
        label: `Resume ${workspace.resumeLesson.lessonTitle}`,
        description: `Last review ${formatRelativeTime(workspace.resumeLesson.lastAttemptAt)} · ${workspace.resumeLesson.masteredCount}/${workspace.resumeLesson.totalExercises} mastered`,
        icon: '🎯',
      });
    }

    if (workspace.studyPlan[0]) {
      const item = workspace.studyPlan[0];
      actions.push({
        to: item.lessonSlug ? `/lessons/${item.lessonSlug}` : '/',
        label: 'Suggested next exercise',
        description: `${item.lessonTitle} — ${item.reason}`,
        icon: '📌',
      });
    }

    const dueDeck = workspace.deckDue.find((entry) => entry.due > 0);
    actions.push({
      to: '/flashcards',
      label: 'Continue flashcard reviews',
      description: dueDeck
        ? `${deckLabel(dueDeck.deck)} deck · ${dueDeck.due} due`
        : 'No cards due — review a favourite deck for a bonus sprint.',
      icon: '🧠',
      badge: workspace.dueFlashcards ? `${workspace.dueFlashcards} due` : undefined,
    });

    if (workspace.weakestTag) {
      actions.push({
        to: `/dashboard?focus=${encodeURIComponent(workspace.weakestTag.tag)}`,
        label: 'Inspect weakest tag',
        description: `${workspace.weakestTag.tag} · ${workspace.weakestTag.accuracy.toFixed(0)}% accuracy`,
        icon: '🛠️',
      });
    }

    return actions.slice(0, 3);
  }, [workspace]);

  const handleNavToggle = () => {
    setNavCollapsed((prev) => !prev);
  };

  return (
    <div className={styles.appShell} data-focus-mode={focusMode ? 'on' : 'off'}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.shellLayout}>
        <aside
          className={styles.primaryColumn}
          aria-label="Workspace navigation"
          data-collapsed={navCollapsed}
          aria-hidden={navCollapsed}
        >
          <div className={styles.brandBlock}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoMark} aria-hidden="true">
                SC
              </span>
              <span className={styles.logoText}>Study Spanish Coach</span>
            </Link>
            <p className={styles.tagline}>
              Daily Spanish sprints, analytics and flashcards in a social-inspired dashboard.
            </p>
          </div>

          <nav className={styles.primaryNav} aria-label="Primary sections">
            <p className={styles.sectionLabel}>Browse workspace</p>
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

          <section className={styles.quickSection} aria-labelledby="quick-actions-heading">
            <div className={styles.sectionHeader}>
              <p id="quick-actions-heading" className={styles.sectionLabel}>
                Quick launch
              </p>
              <p className={styles.sectionHint}>
                Updated automatically from your latest analytics snapshot.
              </p>
            </div>
            <div className={styles.quickActions} role="list">
              {quickActions.map(({ to, label, description, icon, badge }) => (
                <Link key={label} to={to} className={styles.quickLink} role="listitem">
                  <span className={styles.quickLinkText}>
                    <span className={styles.quickLinkLabel}>{label}</span>
                    <span className={styles.quickLinkDescription}>{description}</span>
                  </span>
                  <span className={styles.quickLinkMeta}>
                    {badge && <span className={styles.quickLinkBadge}>{badge}</span>}
                    <span className={styles.quickLinkIcon} aria-hidden="true">
                      {icon}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.guideSection} aria-labelledby="navigation-highlights-heading">
            <p id="navigation-highlights-heading" className={styles.sectionLabel}>
              Study digest
            </p>
            <ul className={styles.guideList} role="list">
              {workspace.studyPlan?.length ? (
                <li>
                  <strong>Next up:</strong> {workspace.studyPlan[0].lessonTitle}
                </li>
              ) : (
                <li>Import new lessons to populate personalised recommendations.</li>
              )}
              <li>
                <strong>Flashcards due:</strong> {workspace.dueFlashcards}
              </li>
              {workspace.weakestTag ? (
                <li>
                  <strong>Weakest tag:</strong> {workspace.weakestTag.tag}
                </li>
              ) : (
                <li>
                  Master a lesson to surface detailed tag analytics.
                </li>
              )}
            </ul>
          </section>
        </aside>

        <div className={styles.mainColumn}>
          <header className={styles.toolbar} aria-label="Workspace controls">
            <div className={styles.toolbarIntro}>
              <button
                type="button"
                className={styles.navToggle}
                onClick={handleNavToggle}
                aria-pressed={!navCollapsed}
                aria-label={navCollapsed ? 'Show navigation' : 'Hide navigation'}
              >
                {navCollapsed ? '☰ Menu' : '✕ Hide menu'}
              </button>
              <div className={styles.flowPill} aria-hidden="true">
                <span>Plan</span>
                <span>Practice</span>
                <span>Reflect</span>
              </div>
              <div className={styles.toolbarText}>
                <p className={styles.toolbarTitle}>Craft today’s study block</p>
                <p className={styles.toolbarSubtitle}>
                  Use the left rail to jump around, search the lesson library, or flip on focus mode to hide supporting panels.
                </p>
              </div>
            </div>
            <div className={styles.toolbarActions}>
              <form className={styles.toolbarSearch} role="search" onSubmit={handleSearch}>
                <label htmlFor="global-search" className="sr-only">
                  Search lessons and tags
                </label>
                <input
                  id="global-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className={styles.searchInput}
                  placeholder="Search lessons, tags, objectives…"
                  type="search"
                />
                <button type="submit" className={styles.searchButton}>
                  Search
                </button>
              </form>
              <button
                type="button"
                role="switch"
                aria-checked={highContrastEnabled}
                onClick={onToggleHighContrast}
                className={styles.contrastToggle}
                data-active={highContrastEnabled}
                aria-label="Toggle high-contrast theme"
                title="Toggle high-contrast theme"
              >
                <span className={styles.toggleThumb} aria-hidden="true">
                  {highContrastEnabled ? 'HC' : 'Aa'}
                </span>
                <span className={styles.toggleLabels}>
                  <span>Light</span>
                  <span>Contrast</span>
                </span>
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={focusMode}
                onClick={() => setFocusMode((prev) => !prev)}
                className={styles.focusToggle}
                data-active={focusMode}
                aria-label="Toggle focus mode"
                title="Toggle focus mode"
              >
                <span>Focus mode</span>
                <span className={styles.focusStatus} aria-live="polite">
                  {focusMode ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          </header>

          <div className={styles.contentArea} data-focus={focusMode ? 'on' : 'off'}>
            <main id="main-content" tabIndex={-1} className={styles.main}>
              {mainContent}
            </main>

            <aside className={styles.sidePanel} aria-label="Study tips">
              <section className={`ui-card ui-card--muted ${styles.sideCard}`}>
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

              <section className={`ui-card ui-card--muted ${styles.sideCard}`}>
                <span className="ui-section__tag">Documentation</span>
                <ul className="ui-section">
                  <li>
                    <a href="/docs/anki-export.md" target="_blank" rel="noreferrer">
                      How to export Anki decks
                    </a>
                  </li>
                  <li>
                    <a href="/docs/exam-day-checklist.md" target="_blank" rel="noreferrer">
                      Exam-day speaking checklist
                    </a>
                  </li>
                  <li>
                    <a href="/docs/study-playbook.md" target="_blank" rel="noreferrer">
                      Study session playbook
                    </a>
                  </li>
                </ul>
              </section>
            </aside>
          </div>

          <footer className={styles.footer} aria-label="Site footer">
            Curious what changed? Review the <a href="/docs/changelog.md">changelog</a> or sync the latest bundle in the content manager.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AppShell;

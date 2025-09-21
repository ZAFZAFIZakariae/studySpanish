import React, { useMemo, useState } from 'react';
import { Link, NavLink, To, useLocation } from 'react-router-dom';
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

type CommandItem = {
  key: string;
  to?: To;
  label: string;
  hint: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
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
  const location = useLocation();
  const plannerAnchor: To = { pathname: '/', hash: '#lesson-library' };
  const workspace = useWorkspaceSnapshot();

  const commandItems: CommandItem[] = useMemo(() => {
    if (workspace.loading) {
      return [
        {
          key: 'loading',
          label: 'Syncing your workspace…',
          hint: 'We’re gathering lessons, flashcards and analytics.',
          icon: '⏳',
          disabled: true,
        },
      ];
    }

    const items: CommandItem[] = [];

    if (workspace.resumeLesson) {
      items.push({
        key: 'resume',
        to: workspace.resumeLesson.lessonSlug
          ? `/lessons/${workspace.resumeLesson.lessonSlug}`
          : plannerAnchor,
        label: `Resume ${workspace.resumeLesson.lessonTitle}`,
        hint: workspace.resumeLesson.lastAttemptAt
          ? `Last review ${formatRelativeTime(workspace.resumeLesson.lastAttemptAt)}`
          : 'Pick up right where you left off.',
        icon: '🎯',
        badge: `${workspace.resumeLesson.masteredCount}/${workspace.resumeLesson.totalExercises}`,
      });
    }

    if (workspace.studyPlan[0]) {
      const next = workspace.studyPlan[0];
      if (!workspace.resumeLesson || workspace.resumeLesson.lessonId !== next.lessonId) {
        items.push({
          key: 'plan',
          to: next.lessonSlug ? `/lessons/${next.lessonSlug}` : plannerAnchor,
          label: `Start ${next.lessonTitle}`,
          hint: next.reason,
          icon: '🗂️',
        });
      }
    }

    const dueDeck = workspace.deckDue.find((entry) => entry.due > 0);
    items.push({
      key: 'flashcards',
      to: '/flashcards',
      label: dueDeck ? `Review ${deckLabel(dueDeck.deck)}` : 'Flashcard sprint',
      hint: dueDeck
        ? `${dueDeck.due} card${dueDeck.due === 1 ? '' : 's'} due now`
        : 'All caught up — run a freestyle warm-up.',
      icon: '🧠',
      badge: workspace.dueFlashcards ? `${workspace.dueFlashcards}` : undefined,
    });

    if (workspace.weakestTag) {
      items.push({
        key: 'weakest-tag',
        to: `/dashboard?focus=${encodeURIComponent(workspace.weakestTag.tag)}`,
        label: `Boost ${workspace.weakestTag.tag}`,
        hint: `${workspace.weakestTag.accuracy.toFixed(0)}% accuracy`,
        icon: '🎯',
      });
    }

    return items.slice(0, 3);
  }, [plannerAnchor, workspace]);

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
            <span className={styles.brandName}>Study Spanish Coach</span>
            <span className={styles.brandTagline}>Plan · Practise · Shine</span>
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

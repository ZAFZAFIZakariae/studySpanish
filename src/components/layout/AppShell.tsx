import React, { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FocusModeContext } from '../../contexts/FocusModeContext';
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
    label: 'Home',
    description: 'Choose what to study',
    icon: '🏠',
    exact: true,
  },
  {
    to: '/parameters',
    label: 'Parameters',
    description: 'Tools and preferences',
    icon: '⚙️',
  },
  {
    to: '/subjects',
    label: 'Subjects',
    description: 'Browse study subjects',
    icon: '📚',
  },
  {
    to: '/subject-pdfs',
    label: 'Subject PDFs',
    description: 'Browse resources and trigger extraction',
    icon: '📄',
  },
];

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  const [focusMode, setFocusMode] = useState(false);
  const location = useLocation();

  const contextValue = useMemo(
    () => ({
      focusMode,
      setFocusMode,
      toggleFocusMode: () => setFocusMode((prev) => !prev),
    }),
    [focusMode]
  );

  const mainClassName = [
    styles.main,
    focusMode ? styles.mainFocused : '',
    location.pathname.startsWith('/lessons') ? styles.mainLesson : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <FocusModeContext.Provider value={contextValue}>
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
    </FocusModeContext.Provider>
  );
};

export default AppShell;

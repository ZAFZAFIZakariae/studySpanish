import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  icon?: React.ReactNode;
  exact?: boolean;
  showInSidebar?: boolean;
};

const navIcons = {
  home: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  settings: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.4 15a1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.4 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 7 3.4V3.3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 12 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 18.6 8a1.65 1.65 0 0 0 1.51 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 2Z" />
    </svg>
  ),
  subjects: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  spanish: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 4a16 16 0 0 1 0 16M12 4a16 16 0 0 0 0 16" />
    </svg>
  ),
  document: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M6 3h7l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M13 3v5h5" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  dashboard: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 13h4v7H4zM10 9h4v11h-4zM16 5h4v15h-4z" />
    </svg>
  ),
  flashcards: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 9h6M7 13h4" />
      <path d="m9 3 12 4v10a2 2 0 0 1-2 2h-2" />
    </svg>
  ),
  content: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 7 6.4 3.5a2 2 0 0 1 1.4-.5h8.4a2 2 0 0 1 1.4.5L21 7" />
      <path d="M8 11h8" />
    </svg>
  ),
  lesson: (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 5a2 2 0 0 1 2-2h5l2 2h7v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  ),
};

const DESKTOP_BREAKPOINT = '(min-width: 1024px)';

const isDesktopViewport = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(DESKTOP_BREAKPOINT).matches;

const navigation: NavigationItem[] = [
  {
    to: '/',
    label: 'Home',
    description: 'Choose what to study',
    icon: navIcons.home,
    exact: true,
  },
  {
    to: '/parameters',
    label: 'Parameters',
    description: 'Tools and preferences',
    icon: navIcons.settings,
  },
  {
    to: '/subjects',
    label: 'Subjects',
    description: 'Browse study subjects',
    icon: navIcons.subjects,
  },
  {
    to: '/spanish',
    label: 'Spanish',
    description: 'General Spanish resources',
    icon: navIcons.spanish,
  },
  {
    to: '/subject-pdfs',
    label: 'Subject PDFs',
    description: 'Browse resources and trigger extraction',
    icon: navIcons.document,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Progress analytics and trends',
    icon: navIcons.dashboard,
    showInSidebar: false,
  },
  {
    to: '/flashcards',
    label: 'Flashcards',
    description: 'Spaced repetition trainer',
    icon: navIcons.flashcards,
    showInSidebar: false,
  },
  {
    to: '/content-manager',
    label: 'Content manager',
    description: 'Upload and validate lesson bundles',
    icon: navIcons.content,
    showInSidebar: false,
  },
  {
    to: '/lessons',
    label: 'Lesson workspace',
    description: 'Deep-dive lesson workspace',
    icon: navIcons.lesson,
    showInSidebar: false,
  },
];

const matchesPath = (item: NavigationItem, pathname: string) => {
  if (item.exact) {
    return pathname === item.to;
  }

  if (item.to === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(item.to);
};

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  const [focusMode, setFocusMode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => isDesktopViewport());
  const [sidebarOpen, setSidebarOpen] = useState(() => isDesktopViewport());
  const wasFocusMode = useRef(false);
  const focusModeRef = useRef(focusMode);
  const sidebarWasOpenBeforeFocus = useRef(false);
  const location = useLocation();

  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsDesktop(false);
      setSidebarOpen(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    const applyMediaState = (matches: boolean) => {
      setIsDesktop(matches);
      setSidebarOpen(matches && !focusModeRef.current);
    };

    applyMediaState(mediaQuery.matches);

    const handleMediaChange = (event: MediaQueryListEvent) => {
      applyMediaState(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }

    mediaQuery.addListener(handleMediaChange);
    return () => mediaQuery.removeListener(handleMediaChange);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    setSidebarOpen(false);
  }, [location.pathname, isDesktop]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    if (focusMode && !wasFocusMode.current) {
      sidebarWasOpenBeforeFocus.current = sidebarOpen;
      setSidebarOpen(false);
    }

    if (
      !focusMode &&
      wasFocusMode.current &&
      isDesktop &&
      sidebarWasOpenBeforeFocus.current
    ) {
      setSidebarOpen(true);
      sidebarWasOpenBeforeFocus.current = false;
    }

    if (!focusMode && wasFocusMode.current) {
      sidebarWasOpenBeforeFocus.current = false;
    }

    wasFocusMode.current = focusMode;
  }, [focusMode, isDesktop, sidebarOpen]);

  const contextValue = useMemo(
    () => ({
      focusMode,
      setFocusMode,
      toggleFocusMode: () => setFocusMode((prev) => !prev),
    }),
    [focusMode]
  );

  const sidebarItems = useMemo(
    () => navigation.filter((item) => item.showInSidebar !== false),
    []
  );

  const activeMeta = useMemo(
    () => navigation.find((item) => matchesPath(item, location.pathname)),
    [location.pathname]
  );

  const mainClassName = [
    styles.main,
    focusMode ? styles.mainFocused : '',
    location.pathname.startsWith('/lessons') ? styles.mainLesson : '',
  ]
    .filter(Boolean)
    .join(' ');

  const closeSidebar = () => setSidebarOpen(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleNavClick = () => {
    if (!isDesktop) {
      closeSidebar();
    }
  };

  const highContrastLabel = highContrastEnabled ? 'High contrast' : 'Standard';

  return (
    <FocusModeContext.Provider value={contextValue}>
      <div
        className={styles.appShell}
        data-focus-mode={focusMode ? 'on' : 'off'}
        data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      >
        <div className={styles.backdrop} aria-hidden="true" />

        <button
          type="button"
          className={styles.sidebarOverlay}
          onClick={closeSidebar}
          aria-hidden={sidebarOpen ? 'false' : 'true'}
          tabIndex={sidebarOpen ? 0 : -1}
        >
          <span className="sr-only">Close navigation</span>
        </button>

        <aside
          id="app-sidebar"
          className={styles.sidebar}
          aria-label="Primary navigation"
          aria-hidden={!sidebarOpen}
        >
          <div className={styles.sidebarHeader}>
            <Link to="/" className={styles.brand} onClick={handleNavClick}>
              <span className={styles.brandMark} aria-hidden="true">
                SC
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>Study Compass</span>
                <span className={styles.brandTagline}>Spanish revision toolkit</span>
              </span>
            </Link>
          </div>

          <nav className={styles.nav} aria-label="Main sections">
            {sidebarItems.map(({ to, label, icon, exact, description }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.navLinkActive : '']
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={handleNavClick}
                title={description}
              >
                {icon ? (
                  <span className={styles.navIcon} aria-hidden="true">
                    {icon}
                  </span>
                ) : null}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <p className={styles.sidebarFooterTitle}>Curated study extracts</p>
            <p className={styles.sidebarFooterCopy}>
              Keep this sidebar handy to jump between subjects, grammar drills, and PDF resources while you revise.
            </p>
          </div>
        </aside>

        <div className={styles.mainColumn}>
          <header className={styles.topBar} aria-label="Page overview">
            <div className={styles.topBarLeading}>
              <button
                type="button"
                className={styles.menuButton}
                onClick={toggleSidebar}
                aria-expanded={sidebarOpen}
                aria-controls="app-sidebar"
              >
                <span className="sr-only">Toggle navigation</span>
                <svg
                  aria-hidden="true"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>

              <div className={styles.topMeta}>
                <p className={styles.topEyebrow}>Study Compass</p>
                <p className={styles.topTitle}>{activeMeta?.label ?? 'Subjects & resources'}</p>
                <p className={styles.topSubtitle}>
                  {activeMeta?.description ?? 'Curated study extracts at your fingertips'}
                </p>
              </div>
            </div>

            <div className={styles.topActions}>
              <button
                type="button"
                className={[
                  styles.contrastButton,
                  highContrastEnabled ? styles.contrastButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={highContrastEnabled}
                onClick={onToggleHighContrast}
              >
                <span className={styles.contrastButtonIcon} aria-hidden="true">
                  {highContrastEnabled ? '🌙' : '🌞'}
                </span>
                <span className={styles.contrastButtonLabel}>{highContrastLabel}</span>
              </button>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className={mainClassName}>
            <div className={styles.mainInner}>{children}</div>
          </main>

          <footer className={styles.footer} aria-label="Site footer">
            <p>
              Curious what’s new? Browse the <a href="/docs/changelog.md">changelog</a> or sync the latest bundle in the
              content manager.
            </p>
          </footer>
        </div>
      </div>
    </FocusModeContext.Provider>
  );
};

export default AppShell;

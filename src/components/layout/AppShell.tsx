import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

interface AppShellProps {
  highContrastEnabled: boolean;
  onToggleHighContrast: () => void;
  children: React.ReactNode;
}

const navigation = [
  {
    to: '/',
    label: 'Overview',
    description: 'Plan the next study block at a glance.',
    exact: true,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Progress analytics and weak spots.',
  },
  {
    to: '/flashcards',
    label: 'Flashcards',
    description: 'Spaced repetition trainer.',
  },
  {
    to: '/content-manager',
    label: 'Content manager',
    description: 'Import JSON lesson bundles.',
  },
];

const quickActions = [
  {
    to: '/dashboard',
    label: 'Review analytics',
    description: 'Start with the weakest skills and tags.',
  },
  {
    to: '/flashcards',
    label: 'Warm-up with flashcards',
    description: 'Clear due connectors in five focused minutes.',
  },
  {
    to: '/content-manager',
    label: 'Refresh content bundle',
    description: 'Import the latest JSON drop before you begin.',
  },
];

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  const [focusMode, setFocusMode] = useState(false);

  const renderNavigation = () =>
    navigation.map(({ to, label, description, exact }) => (
      <NavLink
        key={to}
        to={to}
        end={exact}
        className={({ isActive }) =>
          [
            'group flex min-w-[200px] flex-1 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition focus-visible:ring',
            isActive
              ? highContrastEnabled
                ? 'border-yellow-400 bg-black text-yellow-100 shadow-none'
                : 'border-blue-500 bg-white/90 text-blue-900 shadow-lg shadow-blue-100/60 backdrop-blur'
              : highContrastEnabled
              ? 'border-slate-500 bg-transparent text-white hover:border-yellow-400'
              : 'border-transparent bg-white/40 text-slate-600 hover:border-blue-200 hover:bg-white/70 hover:text-slate-900',
          ].join(' ')
        }
      >
        <span className="space-y-1">
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block text-xs text-slate-500 group-hover:text-slate-700">
            {description}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-base text-blue-600 transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </NavLink>
    ));

  return (
    <div
      className={`relative min-h-screen ${
        highContrastEnabled
          ? 'bg-black text-white'
          : 'bg-gradient-to-br from-slate-100 via-white to-sky-100 text-slate-900'
      }`}
    >
      {!highContrastEnabled && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-[-14rem] h-[22rem] w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200 via-blue-100 to-indigo-200 opacity-60 blur-3xl" />
          <div className="absolute bottom-[-16rem] right-[-6rem] h-[20rem] w-[20rem] rounded-full bg-gradient-to-br from-emerald-200 to-transparent opacity-70 blur-3xl" />
          <div className="absolute bottom-[-18rem] left-[-8rem] h-[18rem] w-[18rem] rounded-full bg-gradient-to-tr from-blue-200 via-white to-transparent opacity-60 blur-3xl" />
        </div>
      )}

      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur" aria-label="Primary navigation">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="space-y-1">
              <Link to="/" className="text-2xl font-semibold text-slate-900 focus-visible:ring">
                Study Spanish Coach
              </Link>
              <p className="text-sm text-slate-600">
                Organise B1–C1 lessons, practice, and flashcards in one coach-like workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span className="rounded-full bg-slate-900 px-2 py-[2px] text-white">Plan</span>
                <span className="px-2 py-[2px]">Practice</span>
                <span className="px-2 py-[2px]">Reflect</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={highContrastEnabled}
                onClick={onToggleHighContrast}
                className={`relative flex h-9 w-16 items-center rounded-full border px-1 transition focus-visible:ring ${
                  highContrastEnabled
                    ? 'border-yellow-400 bg-black text-yellow-200'
                    : 'border-slate-200 bg-white/80 text-slate-500 hover:border-blue-200'
                }`}
                aria-label="Toggle high-contrast theme"
              >
                <span className="flex w-full items-center justify-between px-1 text-[11px] font-semibold uppercase">
                  <span>Aa</span>
                  <span>HC</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-1 top-[6px] inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-600 shadow transition ${
                    highContrastEnabled ? 'translate-x-7 bg-yellow-300 text-slate-900' : ''
                  }`}
                >
                  {highContrastEnabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          </div>
          <div className="border-t border-slate-200/70 bg-white/70">
            <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-3" role="navigation" aria-label="Site sections">
              {renderNavigation()}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_240px] xl:gap-6">
          <aside className="order-2 mb-6 space-y-4 xl:order-1 xl:mb-0" aria-label="Session planner">
            <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur">
              <header className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Session planner</h2>
                <span className="text-xs font-semibold text-blue-600">
                  {focusMode ? 'Focus mode' : 'Prep mode'}
                </span>
              </header>
              <p className="mt-3 text-sm text-slate-600">
                Map out the next study sprint with curated shortcuts.
              </p>
              <div className="mt-4 space-y-2" role="list">
                {quickActions.map(({ to, label, description }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus-visible:ring"
                  >
                    <span className="text-left">
                      <span className="block font-semibold">{label}</span>
                      <span className="block text-xs text-slate-500 group-hover:text-slate-600">{description}</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-blue-500 transition-transform group-hover:translate-x-1">
                      ↗
                    </span>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={focusMode}
                onClick={() => setFocusMode((prev) => !prev)}
                className={`mt-4 w-full rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:ring ${
                  focusMode
                    ? 'border-blue-500 bg-blue-600 text-white shadow'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                {focusMode ? 'Focus mode enabled' : 'Enable focus mode'}
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow shadow-slate-200/30 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Navigation highlights</h2>
              <p className="mt-3 text-sm text-slate-600">
                Each page is optimised for one step of your bilingual workflow—pin this panel if you need a
                reminder.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600" role="list">
                <li>
                  <span className="font-semibold text-slate-800">Overview:</span> plan what to learn next.
                </li>
                <li>
                  <span className="font-semibold text-slate-800">Dashboard:</span> inspect accuracy trends.
                </li>
                <li>
                  <span className="font-semibold text-slate-800">Flashcards:</span> reinforce quick wins.
                </li>
                <li>
                  <span className="font-semibold text-slate-800">Content:</span> keep lessons synced offline.
                </li>
              </ul>
            </section>
          </aside>

          <main
            id="main-content"
            tabIndex={-1}
            className={`order-1 min-w-0 space-y-10 focus:outline-none ${
              focusMode
                ? 'rounded-3xl border border-blue-200/80 bg-white/85 p-6 shadow-2xl shadow-blue-200/50 backdrop-blur'
                : ''
            }`}
          >
            {children}
          </main>

          <aside className="order-3 space-y-4" aria-label="Study tips">
            <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow shadow-slate-200/30 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Session checklist</h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-medium">1. Review metrics.</span>{' '}
                  <Link to="/dashboard" className="text-blue-700 underline focus-visible:ring">
                    Open the dashboard
                  </Link>{' '}
                  to choose a focus tag.
                </li>
                <li>
                  <span className="font-medium">2. Work through one lesson.</span>{' '}
                  Skim the overview below and pick the next item in your queue.
                </li>
                <li>
                  <span className="font-medium">3. Reinforce with flashcards.</span>{' '}
                  <Link to="/flashcards" className="text-blue-700 underline focus-visible:ring">
                    Run the due deck
                  </Link>{' '}
                  to lock it in.
                </li>
              </ol>
            </section>

            <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow shadow-slate-200/30 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Keep content fresh</h2>
              <p className="mt-3 text-sm text-slate-600">
                Import JSON bundles in the content manager to refresh lessons and practise sets. Once loaded,
                everything is cached for offline work.
              </p>
              <Link
                to="/content-manager"
                className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline focus-visible:ring"
              >
                Go to Content manager
              </Link>
            </section>
          </aside>
        </div>

        <footer
          className={`border-t ${
            highContrastEnabled
              ? 'border-slate-100 bg-black text-slate-100'
              : 'border-slate-200/70 bg-white/80 text-slate-500 backdrop-blur'
          }`}
          aria-label="Site footer"
        >
          <div className="mx-auto max-w-6xl px-4 py-4 text-sm">
            Launch locally with <code>npm install</code> then <code>npm run dev</code>.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppShell;

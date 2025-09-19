import React from 'react';
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

export const AppShell: React.FC<AppShellProps> = ({
  highContrastEnabled,
  onToggleHighContrast,
  children,
}) => {
  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 ${
        highContrastEnabled ? 'high-contrast' : ''
      }`}
    >
      <header className="border-b bg-white/90 backdrop-blur" aria-label="Primary navigation">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="space-y-1">
            <Link to="/" className="text-2xl font-semibold text-slate-900 focus-visible:ring">
              Study Spanish Coach
            </Link>
            <p className="text-sm text-slate-600">
              Organise B1–C1 lessons, practice and flashcards in one coach-like workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleHighContrast}
            aria-pressed={highContrastEnabled}
            className="rounded border border-slate-400 px-3 py-1 text-sm font-medium focus-visible:ring"
            aria-label="Toggle high-contrast theme"
          >
            {highContrastEnabled ? 'Use standard theme' : 'Enable high contrast'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_260px]">
          <aside className="order-1 space-y-4" aria-label="Site navigation">
            <nav className="rounded-xl border bg-white p-4 shadow-sm" aria-label="Main navigation">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Navigate</h2>
              <ul className="mt-3 space-y-1" role="list">
                {navigation.map(({ to, label, description, exact }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={exact}
                      className={({ isActive }) =>
                        `block rounded-lg border px-3 py-2 transition focus-visible:ring ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-transparent hover:border-blue-200 hover:bg-slate-50'
                        }`
                      }
                    >
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-slate-500">{description}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main id="main-content" tabIndex={-1} className="order-2 min-w-0 space-y-8 focus:outline-none">
            {children}
          </main>

          <aside className="order-3 space-y-4" aria-label="Study tips">
            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Session checklist
              </h2>
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

            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Keep content fresh
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Import JSON bundles in the Content manager to refresh lessons and practise sets. Once loaded,
                everything is cached for offline work.
              </p>
              <Link to="/content-manager" className="mt-3 inline-flex text-sm font-medium text-blue-700 underline focus-visible:ring">
                Go to Content manager
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <footer className="border-t bg-white" aria-label="Site footer">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500">
          Launch locally with <code>npm install</code> then <code>npm run dev</code>.
        </div>
      </footer>
    </div>
  );
};

export default AppShell;

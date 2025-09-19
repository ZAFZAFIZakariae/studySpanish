import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import LessonPage from './pages/LessonPage';
import FlashcardsPage from './pages/FlashcardsPage';
import ContentManagerPage from './pages/ContentManagerPage';
import { useHighContrast } from './hooks/useHighContrast';

const App: React.FC = () => {
  const { enabled, toggle } = useHighContrast();

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className={`min-h-screen bg-white text-gray-900 ${enabled ? 'high-contrast' : ''}`}>
        <header className="border-b bg-gray-50" aria-label="Primary navigation">
          <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3">
            <div>
              <h1 className="text-xl font-semibold">Study Spanish Coach</h1>
              <p className="text-sm text-gray-600">B1–C1 skills on demand</p>
            </div>
            <nav aria-label="Main">
              <ul className="flex flex-wrap items-center gap-4" role="list">
                <li>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `focus-visible:ring px-2 py-1 rounded ${isActive ? 'font-semibold underline' : ''}`
                    }
                  >
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `focus-visible:ring px-2 py-1 rounded ${isActive ? 'font-semibold underline' : ''}`
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/flashcards"
                    className={({ isActive }) =>
                      `focus-visible:ring px-2 py-1 rounded ${isActive ? 'font-semibold underline' : ''}`
                    }
                  >
                    Flashcards
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/content-manager"
                    className={({ isActive }) =>
                      `focus-visible:ring px-2 py-1 rounded ${isActive ? 'font-semibold underline' : ''}`
                    }
                  >
                    Content manager
                  </NavLink>
                </li>
              </ul>
            </nav>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={enabled}
              className="rounded border border-gray-400 px-3 py-1 focus-visible:ring"
              aria-label="Toggle high-contrast theme"
            >
              {enabled ? 'Use standard theme' : 'Enable high contrast'}
            </button>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl p-4 space-y-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/content-manager" element={<ContentManagerPage />} />
            <Route path="/lessons/:slug" element={<LessonPage />} />
            <Route
              path="*"
              element={
                <p role="alert" className="text-red-600">
                  Page not found. Use the navigation links above to continue learning.
                </p>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

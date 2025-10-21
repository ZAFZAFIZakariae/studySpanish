import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import LessonPage from './pages/LessonPage';
import FlashcardsPage from './pages/FlashcardsPage';
import ContentManagerPage from './pages/ContentManagerPage';
import { useHighContrast } from './hooks/useHighContrast';
import AppShell from './components/layout/AppShell';
import SubjectsPage from './pages/SubjectsPage';
import SpanishPage from './pages/SpanishPage';
import ParametersPage from './pages/ParametersPage';
import SubjectPdfBrowserPage from './pages/SubjectPdfBrowserPage';

const App: React.FC = () => {
  const { enabled, toggle } = useHighContrast();

  const basename = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return import.meta.env.BASE_URL ?? '/';
    }

    const { pathname } = window.location;

    if (pathname.startsWith('/dist/')) {
      return '/dist';
    }

    if (pathname === '/dist') {
      return '/dist';
    }

    return import.meta.env.BASE_URL ?? '/';
  }, []);

  return (
    <BrowserRouter basename={basename}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppShell highContrastEnabled={enabled} onToggleHighContrast={toggle}>
        <Routes>
          <Route path="index.html" element={<Navigate to="/" replace />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/spanish" element={<SpanishPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subject-pdfs" element={<SubjectPdfBrowserPage />} />
          <Route path="/parameters" element={<ParametersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/content-manager" element={<ContentManagerPage />} />
          <Route path="/lessons/:slug" element={<LessonPage />} />
          <Route
            path="*"
            element={
              <p role="alert" className="ui-alert ui-alert--danger">
                Page not found. Use the navigation links above to continue learning.
              </p>
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
};

export default App;

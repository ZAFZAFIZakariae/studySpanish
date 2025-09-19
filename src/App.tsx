import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import LessonPage from './pages/LessonPage';
import FlashcardsPage from './pages/FlashcardsPage';
import ContentManagerPage from './pages/ContentManagerPage';
import { useHighContrast } from './hooks/useHighContrast';
import AppShell from './components/layout/AppShell';

const App: React.FC = () => {
  const { enabled, toggle } = useHighContrast();

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppShell highContrastEnabled={enabled} onToggleHighContrast={toggle}>
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
      </AppShell>
    </BrowserRouter>
  );
};

export default App;

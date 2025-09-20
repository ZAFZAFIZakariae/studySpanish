import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { db } from './db';
import { ensureSeedData } from './seed';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const renderApp = () => {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const refreshOfflineCache = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const [lessons, exercises] = await Promise.all([
      db.lessons.toArray(),
      db.exercises.toArray(),
    ]);
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'CACHE_DATA',
      lessons,
      exercises,
    });
  } catch (error) {
    console.warn('Unable to refresh offline cache after seeding', error);
  }
};

const bootstrap = async () => {
  try {
    const result = await ensureSeedData();
    if (result.seeded) {
      await refreshOfflineCache();
    }
  } catch (error) {
    console.error('Failed to ensure initial seed data', error);
  } finally {
    renderApp();
  }
};

void bootstrap();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => {
        console.error('Service worker registration failed', error);
      });
  });
}

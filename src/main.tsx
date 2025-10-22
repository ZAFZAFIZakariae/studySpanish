import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ensureSeedData } from './seed';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Unable to find application root element');
}

const placeholderMessage = container.querySelector<HTMLElement>('[data-placeholder-message]');

const setPlaceholderMessage = (message: string) => {
  if (placeholderMessage) {
    placeholderMessage.textContent = message;
    return;
  }
  container.innerHTML = `
    <main class="app-placeholder" aria-busy="true">
      <div class="app-placeholder__panel">
        <h1 class="app-placeholder__title">Study Compass</h1>
        <p class="app-placeholder__message">${message}</p>
      </div>
    </main>
  `;
};

const root = ReactDOM.createRoot(container);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const registerServiceWorker = async () => {
  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in window.navigator)) return;

  try {
    await window.navigator.serviceWorker.register('/service-worker.js');
  } catch (error: unknown) {
    console.error('Service worker registration failed', error);
  }
};

const bootstrap = async () => {
  setPlaceholderMessage('Loading your study workspace…');
  try {
    await ensureSeedData();
  } catch (error) {
    console.error('Failed to ensure seed data', error);
    setPlaceholderMessage('Preparing your study workspace…');
  }
  renderApp();
  void registerServiceWorker();
};

void bootstrap();

if (import.meta.hot) {
  import.meta.hot.accept(() => renderApp());
}

export interface KatexAPI {
  renderToString: (expression: string, options?: { throwOnError?: boolean; displayMode?: boolean; strict?: boolean | 'ignore' }) => string;
}

declare global {
  interface Window {
    katex?: KatexAPI;
  }
}

const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
const STYLE_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';

let loadingPromise: Promise<KatexAPI | null> | null = null;

const ensureStylesheet = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.querySelector('link[data-inline-markdown-katex="true"]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_URL;
  link.setAttribute('data-inline-markdown-katex', 'true');
  document.head.appendChild(link);
};

const injectScript = () => {
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  ensureStylesheet();

  return new Promise<KatexAPI | null>((resolve) => {
    const existing = window.katex;
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve(window.katex ?? null);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.head.appendChild(script);
  });
};

export const loadKatex = (): Promise<KatexAPI | null> => {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.katex) {
    ensureStylesheet();
    return Promise.resolve(window.katex);
  }

  if (!loadingPromise) {
    loadingPromise = injectScript().then((result) => {
      if (!result) {
        loadingPromise = null;
      }
      return result;
    });
  }

  return loadingPromise;
};

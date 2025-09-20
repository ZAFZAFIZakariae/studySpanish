import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';

const STORAGE_KEY = 'high-contrast-enabled';

type HighContrastState = {
  enabled: boolean;
  toggle: () => void;
};

const applyClass = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('high-contrast', enabled);
  document.documentElement.dataset.contrast = enabled ? 'high' : 'default';
};

export const useHighContrast = (): HighContrastState => {
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasExplicitPreference, setHasExplicitPreference] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const setting = await db.settings.get(STORAGE_KEY);
        if (!active) return;
        if (setting) {
          setEnabled(Boolean(setting.value));
          setHasExplicitPreference(true);
        } else if (typeof window !== 'undefined' && window.matchMedia) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setEnabled(prefersDark);
        }
      } finally {
        if (active) setHydrated(true);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyClass(enabled);
    db.settings.put({ key: STORAGE_KEY, value: enabled });
  }, [enabled, hydrated]);

  useEffect(() => {
    if (!hydrated || hasExplicitPreference) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setEnabled(event.matches);
    };
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, [hasExplicitPreference, hydrated]);

  const toggle = useCallback(() => {
    setHasExplicitPreference(true);
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, toggle };
};

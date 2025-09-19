import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';

const STORAGE_KEY = 'high-contrast-enabled';

type HighContrastState = {
  enabled: boolean;
  toggle: () => void;
};

export const useHighContrast = (): HighContrastState => {
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const setting = await db.settings.get(STORAGE_KEY);
        if (!active) return;
        if (setting) setEnabled(Boolean(setting.value));
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
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('high-contrast', enabled);
    }
    db.settings.put({ key: STORAGE_KEY, value: enabled });
  }, [enabled, hydrated]);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, toggle };
};

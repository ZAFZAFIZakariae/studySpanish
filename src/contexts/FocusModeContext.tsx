import React, { createContext, useContext } from 'react';

interface FocusModeContextValue {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  toggleFocusMode: () => void;
}

export const FocusModeContext = createContext<FocusModeContextValue | undefined>(undefined);

export const useFocusMode = (): FocusModeContextValue => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeContext provider');
  }
  return context;
};

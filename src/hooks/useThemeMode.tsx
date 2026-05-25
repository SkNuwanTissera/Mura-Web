import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PaletteMode } from '@mui/material';
import { muraPalette } from '../theme';

const STORAGE_KEY = 'mura-theme-mode';

interface ThemeModeContextValue {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

function readStoredMode(): PaletteMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PaletteMode>(readStoredMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    const isDark = mode === 'dark';
    document.documentElement.style.colorScheme = mode;
    document.body.style.backgroundColor = isDark ? muraPalette.backgroundDark : muraPalette.backgroundLight;
    document.body.style.color = isDark ? muraPalette.white : muraPalette.black;
    const root = document.getElementById('root');
    if (root) {
      root.style.backgroundColor = isDark ? muraPalette.backgroundDark : muraPalette.backgroundLight;
      root.style.minHeight = '100%';
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setModeState((current) => (current === 'light' ? 'dark' : 'light')),
      setMode: setModeState,
    }),
    [mode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return context;
}

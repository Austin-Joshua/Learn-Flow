import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDarkMode: boolean;
  themePreference: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  themePreference: 'dark',
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreference] = useState<ThemeMode>(() => {
    return (localStorage.getItem('learnflow-theme') as ThemeMode) || 'dark';
  });

  const resolveIsDark = useCallback((mode: ThemeMode) => {
    if (mode === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return mode === 'dark';
  }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('learnflow-theme') as ThemeMode) : 'dark';
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    if (saved === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const applyThemeToDOM = useCallback((dark: boolean) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, []);

  useEffect(() => {
    const dark = resolveIsDark(themePreference);
    setIsDarkMode(dark);
    applyThemeToDOM(dark);
    localStorage.setItem('learnflow-theme', themePreference);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themePreference === 'system') {
        const sysDark = mediaQuery.matches;
        setIsDarkMode(sysDark);
        applyThemeToDOM(sysDark);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themePreference, resolveIsDark, applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      const currentDark = prev === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : prev === 'dark';
      const nextMode: ThemeMode = currentDark ? 'light' : 'dark';
      const nextDark = nextMode === 'dark';
      applyThemeToDOM(nextDark);
      setIsDarkMode(nextDark);
      localStorage.setItem('learnflow-theme', nextMode);
      return nextMode;
    });
  }, [applyThemeToDOM]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemePreference(mode);
    const dark = resolveIsDark(mode);
    applyThemeToDOM(dark);
    setIsDarkMode(dark);
    localStorage.setItem('learnflow-theme', mode);
  }, [resolveIsDark, applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, themePreference, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


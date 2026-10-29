'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('c2l_theme') as Theme;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setMounted(true);
  }, []);

  const triggerSmoothTransition = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Clear any pending timeout
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    // Add transitioning class
    root.classList.add('theme-transitioning');

    // Remove after the 400ms transition completes
    transitionTimerRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      transitionTimerRef.current = null;
    }, 450);
  };

  const setTheme = (newTheme: Theme) => {
    triggerSmoothTransition();
    setThemeState(newTheme);
    localStorage.setItem('c2l_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

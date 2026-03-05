import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'syllabind-ds-theme';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply on initial mount only
  useEffect(() => {
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';

    // Use View Transition API for the shimmer wipe effect
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        applyTheme(next);
        setTheme(next);
      });
      transition.ready.then(() => {
        // Animate the new view in from top-left to bottom-right
        const diagonal = Math.hypot(window.innerWidth, window.innerHeight);
        document.documentElement.animate(
          { clipPath: [`circle(0% at 0 0)`, `circle(${diagonal}px at 0 0)`] },
          { duration: 800, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' }
        );
      });
    } else {
      // Fallback for browsers without View Transition API
      applyTheme(next);
      setTheme(next);
    }
  }, [theme]);

  return { theme, toggleTheme } as const;
}

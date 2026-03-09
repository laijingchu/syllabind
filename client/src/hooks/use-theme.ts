import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'syllabind-ds-theme';
const CHOSEN_KEY = 'syllabind-ds-theme-chosen';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
  localStorage.setItem(STORAGE_KEY, theme);

  // Update favicon stroke color to match theme
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) {
    const stroke = theme === 'light' ? 'black' : 'white';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`;
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const chosen = localStorage.getItem(CHOSEN_KEY);
    // Only honor stored preference if user explicitly chose it
    if (chosen && (stored === 'light' || stored === 'dark')) return stored;
    return 'dark';
  });

  // Apply on initial mount only
  useEffect(() => {
    applyTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(CHOSEN_KEY, '1');

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

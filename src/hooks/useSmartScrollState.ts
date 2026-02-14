import { useState, useEffect, useCallback, useRef } from 'react';

type BarState = 'expanded' | 'collapsed';

/**
 * Instant scroll-based filter bar hide/show.
 * No animation, no RAF batching — pure speed.
 * Hysteresis only: show at top (< 10px), hide when scrolled (> 40px).
 */
export function useSmartScrollState() {
  const [barState, setBarState] = useState<BarState>('expanded');
  const lockedUntil = useRef(0);

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll');
    if (!scrollEl) return;

    const handleScroll = () => {
      const now = performance.now();
      if (now < lockedUntil.current) return;

      const scrollTop = scrollEl.scrollTop;

      if (scrollTop < 10) {
        setBarState(prev => {
          if (prev === 'expanded') return prev;
          lockedUntil.current = performance.now() + 100;
          return 'expanded';
        });
      } else if (scrollTop > 40) {
        setBarState(prev => {
          if (prev === 'collapsed') return prev;
          lockedUntil.current = performance.now() + 100;
          return 'collapsed';
        });
      }
    };

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBarClick = useCallback(() => {
    setBarState(prev => {
      const next: BarState = prev === 'collapsed' ? 'expanded' : 'collapsed';
      lockedUntil.current = performance.now() + 200;
      return next;
    });
  }, []);

  return { barState, handleBarClick };
}

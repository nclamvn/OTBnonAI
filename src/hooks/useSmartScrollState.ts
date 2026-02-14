import { useState, useEffect, useCallback, useRef } from 'react';

type BarState = 'expanded' | 'collapsed';

const EXPAND_THRESHOLD = 20;   // px — expand when scrollTop < this
const COLLAPSE_THRESHOLD = 60; // px — collapse when scrollTop > this
const STATE_LOCK_MS = 300;     // ms — lock after scroll-triggered change
const CLICK_LOCK_MS = 400;     // ms — lock after manual click

/**
 * Anti-jitter smart scroll hook for filter bar expand/collapse.
 *
 * 2 mechanisms prevent rapid toggling:
 * 1. Hysteresis dead zone (20–60 px)
 * 2. State lock after change (300ms scroll / 400ms click)
 */
export function useSmartScrollState() {
  const [barState, setBarState] = useState<BarState>('expanded');

  const lockedUntil = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll');
    if (!scrollEl) return;

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const now = performance.now();

        // State lock — skip if still locked
        if (now < lockedUntil.current) return;

        const scrollTop = scrollEl.scrollTop;

        // Hysteresis — only change state outside the dead zone
        let nextState: BarState | null = null;
        if (scrollTop < EXPAND_THRESHOLD) {
          nextState = 'expanded';
        } else if (scrollTop > COLLAPSE_THRESHOLD) {
          nextState = 'collapsed';
        }

        if (nextState !== null) {
          setBarState(prev => {
            if (prev === nextState) return prev;
            lockedUntil.current = performance.now() + STATE_LOCK_MS;
            return nextState;
          });
        }
      });
    };

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleBarClick = useCallback(() => {
    setBarState(prev => {
      const next: BarState = prev === 'collapsed' ? 'expanded' : 'collapsed';
      lockedUntil.current = performance.now() + CLICK_LOCK_MS;
      return next;
    });
  }, []);

  return { barState, handleBarClick };
}

import { useState, useEffect, useCallback, useRef } from 'react';

type BarState = 'expanded' | 'collapsed';

const EXPAND_THRESHOLD = 30;   // px — expand when scrollTop < this
const COLLAPSE_THRESHOLD = 80; // px — collapse when scrollTop > this
const STATE_LOCK_MS = 300;     // ms — lock after scroll-triggered change
const CLICK_LOCK_MS = 500;     // ms — lock after manual click
const ANIM_LOCK_MS = 350;      // ms — lock during CSS height transition
const MIN_VELOCITY = 0.5;      // px/ms — minimum scroll speed to react
const MIN_DELTA = 20;          // px — minimum scroll distance from anchor
const CONSECUTIVE_REQUIRED = 3; // consecutive same-direction ticks needed

/**
 * Anti-jitter smart scroll hook for filter bar expand/collapse.
 *
 * 5 mechanisms prevent rapid toggling near the threshold:
 * 1. Hysteresis dead zone (30–80 px)
 * 2. State lock after change (300ms scroll / 500ms click)
 * 3. Velocity check (>= 0.5 px/ms)
 * 4. Consecutive direction tracking (3 ticks same direction)
 * 5. Minimum scroll delta (20px from anchor position)
 */
export function useSmartScrollState() {
  const [barState, setBarState] = useState<BarState>('expanded');

  // Refs for anti-jitter logic
  const lockedUntil = useRef(0);
  const isAnimating = useRef(false);
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(0);
  const consecutiveDir = useRef(0); // positive = scrolling down, negative = scrolling up
  const anchorPos = useRef(0);
  const rafRef = useRef(0);

  // Animation lock — block during CSS height transition
  useEffect(() => {
    isAnimating.current = true;
    const timer = setTimeout(() => { isAnimating.current = false; }, ANIM_LOCK_MS);
    return () => clearTimeout(timer);
  }, [barState]);

  // Scroll listener with all 5 anti-jitter mechanisms
  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll');
    if (!scrollEl) return;

    // Initialize refs
    lastScrollTop.current = scrollEl.scrollTop;
    lastScrollTime.current = performance.now();
    anchorPos.current = scrollEl.scrollTop;

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const now = performance.now();

        // (2) State lock — skip if still locked or animating
        if (now < lockedUntil.current || isAnimating.current) {
          lastScrollTop.current = scrollEl.scrollTop;
          lastScrollTime.current = now;
          return;
        }

        const scrollTop = scrollEl.scrollTop;
        const dt = now - lastScrollTime.current;
        const dy = scrollTop - lastScrollTop.current;

        // (3) Velocity check — ignore slow/idle scrolls
        const velocity = dt > 0 ? Math.abs(dy) / dt : 0;
        if (velocity < MIN_VELOCITY) {
          lastScrollTop.current = scrollTop;
          lastScrollTime.current = now;
          return;
        }

        // (4) Consecutive direction tracking
        if (dy > 0) {
          consecutiveDir.current = consecutiveDir.current > 0 ? consecutiveDir.current + 1 : 1;
        } else if (dy < 0) {
          consecutiveDir.current = consecutiveDir.current < 0 ? consecutiveDir.current - 1 : -1;
        }
        // Reset anchor when direction changes
        if ((dy > 0 && consecutiveDir.current === 1) || (dy < 0 && consecutiveDir.current === -1)) {
          anchorPos.current = lastScrollTop.current;
        }

        lastScrollTop.current = scrollTop;
        lastScrollTime.current = now;

        if (Math.abs(consecutiveDir.current) < CONSECUTIVE_REQUIRED) return;

        // (5) Minimum delta from anchor
        const delta = Math.abs(scrollTop - anchorPos.current);
        if (delta < MIN_DELTA) return;

        // (1) Hysteresis — only change state outside the dead zone
        let nextState: BarState | null = null;
        if (scrollTop < EXPAND_THRESHOLD) {
          nextState = 'expanded';
        } else if (scrollTop > COLLAPSE_THRESHOLD) {
          nextState = 'collapsed';
        }
        // Inside dead zone (30–80px) → no change

        if (nextState !== null) {
          setBarState(prev => {
            if (prev === nextState) return prev;
            // (2) Apply state lock
            lockedUntil.current = performance.now() + STATE_LOCK_MS;
            anchorPos.current = scrollTop;
            consecutiveDir.current = 0;
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

  // Click handler — toggle with longer lock to absorb layout-shift phantom events
  const handleBarClick = useCallback(() => {
    setBarState(prev => {
      const next: BarState = prev === 'collapsed' ? 'expanded' : 'collapsed';
      lockedUntil.current = performance.now() + CLICK_LOCK_MS;
      consecutiveDir.current = 0;
      return next;
    });
  }, []);

  return { barState, handleBarClick };
}

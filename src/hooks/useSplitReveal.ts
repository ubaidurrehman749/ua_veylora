import { useLayoutEffect, useRef } from 'react';
import { gsap, SplitText } from '../lib/gsap';
import { useReducedMotion } from './useReducedMotion';

// Cinematic heading entrance: words rise out of a line mask, one after another.
// SplitText keeps an aria-label with the full text, so screen readers hear the
// heading once, not word by word. Pass `text` so it re-splits when the text changes.
export function useSplitReveal<T extends HTMLElement>(text?: string) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    // The context reverts the split, its tween and its ScrollTrigger together.
    const ctx = gsap.context(() => {
      SplitText.create(el, {
        type: 'lines,words',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 4,
            opacity: 0,
            duration: 1.1,
            stagger: 0.06,
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          }),
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, text]);

  return ref;
}

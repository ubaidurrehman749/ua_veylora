import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useReducedMotion } from './useReducedMotion';

// Rises, sharpens and fades an element in when it scrolls into view.
// Opacity only, never visibility, so hidden items stay reachable by keyboard;
// focusing one reveals it at once. With reduced motion the element is left alone.
export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const tween = gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.98, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          delay,
          clearProps: 'opacity,filter,transform',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        },
      );
      const show = () => tween.progress(1);
      el.addEventListener('focusin', show, { once: true });
      return () => el.removeEventListener('focusin', show);
    }, el);

    return () => ctx.revert();
  }, [reduced, delay]);

  return ref;
}

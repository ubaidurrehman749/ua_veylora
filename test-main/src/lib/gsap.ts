import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// One place to register plugins. Since GSAP 3.13 these are free in the public package.
gsap.registerPlugin(ScrollTrigger, SplitText);

// Shared motion language so every scene moves the same way.
gsap.defaults({ ease: 'expo.out', duration: 1 });

// Trigger positions go stale when content above changes height (e.g. switching missions),
// so refresh once the page settles after any layout change.
if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
  }).observe(document.body);
}

export { gsap, ScrollTrigger, SplitText };

// Site-wide effects: intro loader, scroll-reactive ticker, magnetic links and count-up stats.
// Everything switches off when the visitor prefers reduced motion.
import { useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';
import { scrollToTarget, stopScroll, useCountUp, useMagnetic } from '../lib/motion';

/** Height kept clear for the fixed navbar when jumping to a section. */
const NAV_OFFSET = -72;

/** Smoothly scrolls to an in-page anchor such as "#missions". Returns false if it isn't on the page. */
export function goToAnchor(href: string): boolean {
  if (!href.startsWith('#')) return false;
  const el = document.getElementById(href.slice(1));
  if (!el) return false;
  scrollToTarget(el, { offset: href === '#top' ? 0 : NAV_OFFSET });
  history.replaceState(null, '', href);
  return true;
}

/** onClick for in-page links, so they glide with the smooth scroller instead of jumping. */
export function anchorClick(e: MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href') ?? '';
  if (goToAnchor(href)) e.preventDefault();
}

// ---------- intro loader ----------
/** First visit in a session: a short count-up and title reveal, then the curtain lifts. */
export function Preloader() {
  const [show, setShow] = useState(() => {
    try {
      return !prefersReducedMotion() && !sessionStorage.getItem('abnf.intro');
    } catch {
      return false;
    }
  });
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem('abnf.intro', '1');
    } catch {
      /* storage blocked: the intro may replay, which is harmless */
    }
    stopScroll(true);
    const o = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        stopScroll(false);
        setShow(false);
      },
    });
    tl.from('.pre-word', { yPercent: 110, duration: 0.9, stagger: 0.08, ease: 'power4.out' })
      .to(
        o,
        {
          v: 100,
          duration: 1.3,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (num.current) num.current.textContent = String(Math.round(o.v)).padStart(3, '0');
          },
        },
        0,
      )
      .to('.pre-bar i', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to('.pre-inner', { yPercent: -30, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
      .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.25');
    return () => {
      tl.kill();
      stopScroll(false);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div ref={root} className="preloader" aria-hidden="true">
      <div className="pre-inner">
        <p className="pre-title">
          {['Abandoned', 'but', 'Not', 'Forgotten'].map((w) => (
            <span key={w} className="pre-mask">
              <span className="pre-word">{w}</span>
            </span>
          ))}
        </p>
        <div className="pre-bar">
          <i />
        </div>
        <p className="pre-num">
          <span ref={num}>000</span>
        </p>
      </div>
    </div>
  );
}

// ---------- marquee ----------
/** An endless ticker that speeds up and reverses with your scroll. */
export function Marquee({ items }: { items: ReactNode[] }) {
  const track = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!track.current || prefersReducedMotion()) return;
    const el = track.current;
    const loop = gsap.to(el, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity() / 300;
        const dir = self.direction;
        gsap.to(loop, { timeScale: dir * Math.min(6, 1 + Math.abs(v)), duration: 0.2, ease: 'power1.out', overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power1.out', overwrite: false });
      },
    });
    return () => {
      st.kill();
      loop.kill();
    };
  }, []);
  const row = items.map((it, i) => (
    <span key={i} className="mq-item">
      {it}
      <span className="mq-star">✦</span>
    </span>
  ));
  // Decorative: the same facts appear in the mission stories below.
  return (
    <div className="marquee" aria-hidden="true">
      <div ref={track} className="mq-track">
        {row}
        {row}
      </div>
    </div>
  );
}

// ---------- magnetic link ----------
/** A link that drifts toward the pointer while hovered. In-page anchors scroll smoothly. */
export function MagneticLink({
  href,
  className,
  children,
  cursor,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  cursor?: string;
}) {
  const ref = useMagnetic<HTMLAnchorElement>(0.35);
  return (
    <a ref={ref} href={href} className={className} data-cursor={cursor} onClick={anchorClick}>
      <span className="btn-label">{children}</span>
    </a>
  );
}

// ---------- stats ----------
/** One big number that counts up from zero when it scrolls into view. */
export function Stat({
  value,
  label,
  suffix = '',
  decimals = 0,
}: {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useCountUp<HTMLSpanElement>(value, decimals);
  return (
    <div className="stat">
      <p className="stat-num">
        <span ref={ref}>{value.toLocaleString('en-GB')}</span>
        {suffix}
      </p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

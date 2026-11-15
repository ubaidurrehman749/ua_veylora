import { useEffect } from 'react';
import { ScrollTrigger } from '../lib/gsap';
import { anchorClick } from './fx';
import './Navbar.css';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavbarProps {
  links?: NavLink[];
  /** Number of open questions the learner has answered, shown beside "Your questions". */
  answered?: number;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: '#missions', label: 'Missions' },
  { href: '#timeline', label: 'Timeline' },
  { href: '#questions', label: 'Your questions' },
  { href: '#sources', label: 'Sources' },
];

// Clear over the opening scene, glass once you scroll, and it tucks away while you
// scroll down so it never covers the 3D viewer. Scrolling up brings it back.
export function Navbar({ links = DEFAULT_LINKS, answered = 0 }: NavbarProps) {
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const hide = self.direction === 1 && self.scroll() > 240;
        document.body.classList.toggle('header-hidden', hide);
        document.body.classList.toggle('scrolled', self.scroll() > 20);
      },
    });
    return () => {
      st.kill();
      document.body.classList.remove('header-hidden', 'scrolled');
    };
  }, []);

  return (
    <header className="navbar">
      <a className="navbar__brand" href="#top" onClick={anchorClick} data-cursor="Top">
        <span className="navbar__mark" aria-hidden="true" />
        <span>
          Abandoned <em>but</em> Not Forgotten
        </span>
      </a>
      <nav aria-label="Main">
        <ul className="navbar__links">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={anchorClick}>
                {link.href === '#questions' && (
                  <span className="navbar__star" aria-hidden="true">
                    ✦{' '}
                  </span>
                )}
                {link.label}
                {link.href === '#questions' && answered > 0 && (
                  <span className="navbar__count" aria-label={`${answered} answered`}>
                    {answered}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

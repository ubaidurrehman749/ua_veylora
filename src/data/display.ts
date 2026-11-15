import type { Mission, QuestionTheme, StatusValue } from '../types/mission';

export const STATUS_TEXT: Record<StatusValue, string> = {
  inactive: 'Inactive',
  silent: 'Silent',
  operating: 'Still operating',
};

export const STATUS_GLYPH: Record<StatusValue, string> = {
  inactive: '■',
  silent: '◌',
  operating: '●',
};

// Theme names from PRD 5.4.
export const THEME_TEXT: Record<QuestionTheme, string> = {
  water: 'Water',
  life: 'Ancient Life',
  geology: 'Geology',
  atmosphere: 'Atmosphere',
  exploration: 'Planetary Exploration',
  future: 'Future Missions',
};

export const THEME_ORDER: QuestionTheme[] = [
  'water',
  'life',
  'geology',
  'atmosphere',
  'exploration',
  'future',
];

// Accepts YYYY, YYYY-MM or YYYY-MM-DD. Formats in UTC so the day doesn't shift by timezone.
export function formatDate(value: string): string {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), mo ? Number(mo) - 1 : 0, d ? Number(d) : 1));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    ...(mo ? { month: 'long' as const } : {}),
    ...(d ? { day: 'numeric' as const } : {}),
    timeZone: 'UTC',
  });
}

export function bodyOf(location: Mission['location']): 'Moon' | 'Mars' | 'Deep space' {
  if (/moon/i.test(location)) return 'Moon';
  if (/mars/i.test(location)) return 'Mars';
  return 'Deep space';
}

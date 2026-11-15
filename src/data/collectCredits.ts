import type { Credit, Mission, Source } from '../types/mission';

// Merges sources and credits across missions for the closing scene, without duplicates.
export function collectSourcesAndCredits(
  missions: Pick<Mission, 'sources' | 'credits' | 'verified'>[],
  allowUnverified = import.meta.env.DEV,
): { sources: Source[]; credits: Credit[] } {
  const sources = new Map<string, Source>();
  const credits = new Map<string, Credit>();

  for (const m of missions) {
    if (!m.verified && !allowUnverified) continue;
    m.sources.forEach((s) => sources.set(s.url, s));
    m.credits.forEach((c) => credits.set(`${c.asset}|${c.source}`, c));
  }

  return { sources: [...sources.values()], credits: [...credits.values()] };
}

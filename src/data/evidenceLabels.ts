import type { EvidenceLabel } from '../types/mission';

// Label text is fixed by PRD 6.2.
export const EVIDENCE_LABEL_TEXT: Record<EvidenceLabel, string> = {
  confirmed: 'Confirmed finding',
  interpretation: 'Scientific interpretation',
  unknown: 'Still unknown',
};

export const EVIDENCE_LABEL_GLYPH: Record<EvidenceLabel, string> = {
  confirmed: '✓',
  interpretation: '◆',
  unknown: '?',
};

export const EVIDENCE_LABEL_ORDER: EvidenceLabel[] = [
  'confirmed',
  'interpretation',
  'unknown',
];

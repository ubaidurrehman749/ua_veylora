// Mission record types (PRD section 8). scripts/validate-data.js checks missions.json against these.

import type { ModelHotspot } from '../components/ModelViewer/types';

export type EvidenceLabel = 'confirmed' | 'interpretation' | 'unknown';

export type StatusValue = 'inactive' | 'silent' | 'operating';

export type QuestionTheme =
  | 'water'
  | 'life'
  | 'geology'
  | 'atmosphere'
  | 'exploration'
  | 'future';

export interface MissionStatus {
  value: StatusValue;
  /** YYYY-MM-DD, or null until checked. */
  checkedOn: string | null;
}

export interface EvidenceClaim {
  text: string;
  label: EvidenceLabel;
  sourceId: string;
}

export interface OpenQuestion {
  prompt: string;
  choices: [string, string, string];
  evidenceOptions?: string[];
  theme?: QuestionTheme;
}

export interface Source {
  /** Needed for evidence claims to cite it. */
  id?: string;
  title: string;
  publisher: string;
  url: string;
}

export interface Credit {
  asset: string;
  source: string;
  license: string;
  url?: string;
}

/** A spot on the Moon or Mars globe, in degrees (east longitude positive). */
export interface MissionSite {
  label: string;
  lat: number;
  lon: number;
}

export interface Mission {
  id: string;
  name: string;
  date: string;
  location: string;
  /** Where the machine rests, shown as dots on the opening globes. */
  sites?: MissionSite[];
  goal: string;
  payload: string[];
  story: string;
  modelPath: string;
  /** Picture shown while the 3D model loads, or if it cannot load. */
  fallbackSrc?: string;
  /** World drawn behind the model: moon for lunar machines, mars otherwise. */
  setting?: 'mars' | 'moon';
  /** Text description of the model for screen readers. */
  alt?: string;
  /** Clickable parts on the 3D model. */
  hotspots?: ModelHotspot[];
  status: MissionStatus;
  evidence: EvidenceClaim[];
  openQuestion: OpenQuestion;
  questionTheme: QuestionTheme;
  legacy: string;
  sources: Source[];
  credits: Credit[];
  /** Unverified records only render in development builds. */
  verified: boolean;
  verifiedBy?: string;
}

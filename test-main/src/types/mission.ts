// Mission record types (PRD section 8). /data/schema.json is the source of truth.

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

export interface Mission {
  id: string;
  name: string;
  date: string;
  location: string;
  goal: string;
  payload: string[];
  story: string;
  modelPath: string;
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

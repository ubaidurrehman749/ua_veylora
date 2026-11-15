export interface ModelHotspot {
  id: string;
  /** Short name of the part, e.g. "High-gain antenna". */
  label: string;
  /** One or two plain sentences, written for grade 6–8 readers. */
  description: string;
  /** Position in the normalised model space: the model fits a box about 2 units wide, centred on 0,0,0. */
  position: [number, number, number];
}

/** Matches the project's mission status values (PRD 6.1: inactive, silent or still operating). */
export type ModelStatus = 'inactive' | 'silent' | 'operating';

/** What the viewer's buttons and keyboard shortcuts call on the 3D scene. */
export interface ViewerApi {
  rotate: (radians: number) => void;
  zoom: (factor: number) => void;
  /** Glide back to the starting view. */
  reset: () => void;
  /** Glide to a hotspot, or back to the starting view with null. */
  focus: (position: [number, number, number] | null) => void;
}

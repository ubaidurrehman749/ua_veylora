import type { Mission } from '../types/mission';

export interface StorySectionProps {
  mission: Pick<Mission, 'name' | 'story'>;
}

// The short narrative for the selected machine, shown above its 3D model.
export function StorySection({ mission }: StorySectionProps) {
  return (
    <div className="mission-story">
      <p className="eyebrow">MISSION STORY</p>
      <h2>{mission.name}</h2>
      <p>{mission.story}</p>
    </div>
  );
}

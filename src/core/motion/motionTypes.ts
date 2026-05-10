import type { Season, TimeRangeKey } from '../calendar/calendarTypes';
import type { MascotState } from '../mascot/mascotState';

export type MotionProfile = {
  motionId: string;
  displayName: string;
  vmdPath: string;
  state: MascotState;
  tags?: string[];
  preferredSeasons?: Season[];
  preferredTimeRanges?: TimeRangeKey[];
  preferredCostumeIds?: string[];
  weight?: number;
};

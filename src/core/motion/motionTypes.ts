import type { Season, TimeRangeKey } from '../calendar/calendarTypes';
import type { ModelFormat } from '../character/characterTypes';
import type { MascotState } from '../mascot/mascotState';

export type MotionFormat = 'vmd' | 'vrma' | 'none';

export type MotionProfile = {
  motionId: string;
  displayName: string;
  motionFormat: MotionFormat;
  motionPath?: string;
  state: MascotState;
  supportedModelFormats: ModelFormat[];
  tags?: string[];
  preferredSeasons?: Season[];
  preferredTimeRanges?: TimeRangeKey[];
  preferredCostumeIds?: string[];
  weight?: number;
};

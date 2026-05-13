import type { MascotState } from '../mascot/mascotState';
import type { Season, TimeRangeKey, Weekday } from '../calendar/calendarTypes';
import type { VoiceProfile } from '../voice/voiceTypes';

export type ScreenPosition = {
  x: number;
  y: number;
};

export type PerformanceProfile = 'high' | 'medium' | 'low';

export type CostumeChangeAnimation = 'screenEdge' | 'lightTransform' | 'instant' | 'random';

export type ModelFormat = 'pmx' | 'vrm';

export type ModelProfile = {
  modelId: string;
  displayName: string;
  modelFormat: ModelFormat;
  modelPath: string;
  textureRootPath?: string;
  description?: string;
};

export type CostumeProfile = {
  costumeId: string;
  displayName: string;
  modelId: string;
  description: string;
  promptAddon?: string;
  extraLines?: string[];
  preferredSeasons?: Season[];
  preferredTimeRanges?: TimeRangeKey[];
  preferredDates?: string[];
  preferredWeekdays?: Weekday[];
  preferredEvents?: string[];
  avoidConditions?: string[];
  changeLines?: string[];
  idleLines?: string[];
  touchLines?: string[];
  motionOverrides?: Record<string, string[]>;
  voiceOverrides?: Record<string, unknown>;
  defaultChangeAnimation: CostumeChangeAnimation;
};

export type CharacterProfile = {
  characterId: string;
  displayName: string;
  basePrompt: string;
  modelProfiles: ModelProfile[];
  costumes: CostumeProfile[];
  voiceProfiles: VoiceProfile[];
  defaultCostumeId: string;
};

export type CharacterInstance = {
  instanceId: string;
  characterId: string;
  currentCostumeId: string;
  position: ScreenPosition;
  scale: number;
  state: MascotState;
  isVisible: boolean;
  zIndex: number;
  performanceProfile: PerformanceProfile;
};

export type CharacterInstanceCollection = CharacterInstance[];

export type CharacterStorageData = {
  profiles: CharacterProfile[];
  instances: CharacterInstanceCollection;
};

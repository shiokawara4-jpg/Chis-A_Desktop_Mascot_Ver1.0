import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type { CharacterInstanceCollection, CharacterProfile, CharacterStorageData } from '../character/characterTypes';
import type { MotionProfile } from '../motion/motionTypes';
import { defaultAppSettings } from '../settings/appSettings';
import type { StorageDataMap } from './storageAdapter';

export const defaultCharacterInstances: CharacterInstanceCollection = [
  {
    instanceId: 'main-character',
    characterId: 'placeholder-character',
    currentCostumeId: 'default',
    position: { x: 160, y: 260 },
    scale: 1,
    state: 'idleStanding',
    isVisible: true,
    zIndex: 1,
    performanceProfile: 'medium'
  }
];

export const defaultCharacterProfiles: CharacterProfile[] = [
  {
    characterId: 'placeholder-character',
    displayName: 'Placeholder Character',
    basePrompt: '',
    modelProfiles: [
      {
        modelId: 'sample_pmx_model',
        displayName: 'PMX Model',
        modelFormat: 'pmx',
        modelPath: 'C:/MASCOT_ASSETS/models/sample/model.pmx',
        description: 'Sample PMX model registration placeholder.'
      },
      {
        modelId: 'sample_vrm_model',
        displayName: 'VRM Model',
        modelFormat: 'vrm',
        modelPath: 'C:/MASCOT_ASSETS/models/sample/model.vrm',
        description: 'Sample VRM model registration placeholder.'
      }
    ],
    costumes: [
      {
        costumeId: 'default',
        displayName: 'Default',
        modelId: 'sample_pmx_model',
        description: 'Default PMX costume placeholder.',
        defaultChangeAnimation: 'instant'
      }
    ],
    voiceProfiles: [],
    defaultCostumeId: 'default'
  }
];

export const defaultCharacterData: CharacterStorageData = {
  profiles: defaultCharacterProfiles,
  instances: defaultCharacterInstances
};

export const defaultMotions: MotionProfile[] = [];

export const defaultCalendarRules: CalendarReactionRule[] = [];

export const defaultStorageData: StorageDataMap = {
  settings: defaultAppSettings,
  characters: defaultCharacterData,
  motions: defaultMotions,
  calendarRules: defaultCalendarRules
};

import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type { CharacterInstanceCollection } from '../character/characterTypes';
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

export const defaultMotions: MotionProfile[] = [];

export const defaultCalendarRules: CalendarReactionRule[] = [];

export const defaultStorageData: StorageDataMap = {
  settings: defaultAppSettings,
  characters: defaultCharacterInstances,
  motions: defaultMotions,
  calendarRules: defaultCalendarRules
};

import type { AppSettings } from '../settings/appSettings';
import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type { CharacterInstanceCollection } from '../character/characterTypes';
import type { MotionProfile } from '../motion/motionTypes';

export const storageKeys = ['settings', 'characters', 'motions', 'calendarRules'] as const;

export type StorageKey = (typeof storageKeys)[number];

export type StorageDataMap = {
  settings: AppSettings;
  characters: CharacterInstanceCollection;
  motions: MotionProfile[];
  calendarRules: CalendarReactionRule[];
};

export interface StorageAdapter {
  read<TKey extends StorageKey>(key: TKey, fallbackValue: StorageDataMap[TKey]): Promise<StorageDataMap[TKey]>;
  write<TKey extends StorageKey>(key: TKey, value: StorageDataMap[TKey]): Promise<void>;
}

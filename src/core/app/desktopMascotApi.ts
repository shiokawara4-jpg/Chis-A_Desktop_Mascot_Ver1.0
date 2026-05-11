import type { AppInfo } from './appInfo';
import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type { CharacterInstanceCollection } from '../character/characterTypes';
import type { MotionProfile } from '../motion/motionTypes';
import type { AppSettings } from '../settings/appSettings';

export type DesktopMascotStorageApi = {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  getCharacters: () => Promise<CharacterInstanceCollection>;
  saveCharacters: (characters: CharacterInstanceCollection) => Promise<void>;
  getMotions: () => Promise<MotionProfile[]>;
  saveMotions: (motions: MotionProfile[]) => Promise<void>;
  getCalendarRules: () => Promise<CalendarReactionRule[]>;
  saveCalendarRules: (calendarRules: CalendarReactionRule[]) => Promise<void>;
};

export type DesktopMascotApi = {
  getAppInfo: () => Promise<AppInfo>;
  storage: DesktopMascotStorageApi;
};

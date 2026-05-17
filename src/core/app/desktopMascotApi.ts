import type { AppInfo } from './appInfo';
import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type { CharacterStorageData } from '../character/characterTypes';
import type { MotionProfile } from '../motion/motionTypes';
import type { AppSettings } from '../settings/appSettings';

export type RendererDiagnosticLevel = 'warning' | 'error';

export type RendererDiagnosticEntry = {
  level: RendererDiagnosticLevel;
  source: string;
  message: string;
  details?: unknown;
  occurredAt?: string;
};

export type DesktopMascotStorageApi = {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  getCharacters: () => Promise<CharacterStorageData>;
  saveCharacters: (characters: CharacterStorageData) => Promise<void>;
  getMotions: () => Promise<MotionProfile[]>;
  saveMotions: (motions: MotionProfile[]) => Promise<void>;
  getCalendarRules: () => Promise<CalendarReactionRule[]>;
  saveCalendarRules: (calendarRules: CalendarReactionRule[]) => Promise<void>;
};

export type DesktopMascotDiagnosticsApi = {
  logRendererError: (entry: RendererDiagnosticEntry) => Promise<void>;
};

export type DesktopMascotApi = {
  getAppInfo: () => Promise<AppInfo>;
  storage: DesktopMascotStorageApi;
  diagnostics: DesktopMascotDiagnosticsApi;
};

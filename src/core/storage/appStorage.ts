import type { AppSettings } from '../settings/appSettings';
import { defaultAppSettings } from '../settings/appSettings';
import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type { CharacterInstanceCollection } from '../character/characterTypes';
import type { MotionProfile } from '../motion/motionTypes';
import { defaultStorageData } from './defaultStorageData';
import type { StorageAdapter, StorageDataMap, StorageKey } from './storageAdapter';
import { storageKeys } from './storageAdapter';

const cloneStorageValue = <TValue>(value: TValue): TValue => JSON.parse(JSON.stringify(value)) as TValue;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isClickThroughMode = (value: unknown): value is AppSettings['clickThroughMode'] =>
  value === 'window' || value === 'characterOnlyFuture';

const normalizeSettings = (value: unknown): AppSettings => {
  const candidate = isRecord(value) ? (value as Partial<AppSettings>) : {};
  const costumeChange = isRecord(candidate.costumeChange) ? candidate.costumeChange : {};
  const lastWindowState = isRecord(candidate.lastWindowState) ? candidate.lastWindowState : undefined;
  const position = lastWindowState && isRecord(lastWindowState.position) ? lastWindowState.position : {};

  return {
    ...defaultAppSettings,
    ...candidate,
    alwaysOnTop: typeof candidate.alwaysOnTop === 'boolean' ? candidate.alwaysOnTop : defaultAppSettings.alwaysOnTop,
    transparentBackground:
      typeof candidate.transparentBackground === 'boolean'
        ? candidate.transparentBackground
        : defaultAppSettings.transparentBackground,
    launchAtStartup:
      typeof candidate.launchAtStartup === 'boolean' ? candidate.launchAtStartup : defaultAppSettings.launchAtStartup,
    clickThroughMode: isClickThroughMode(candidate.clickThroughMode)
      ? candidate.clickThroughMode
      : defaultAppSettings.clickThroughMode,
    costumeChange: {
      ...defaultAppSettings.costumeChange,
      ...costumeChange
    },
    lastWindowState: {
      ...defaultAppSettings.lastWindowState,
      ...(lastWindowState ?? {}),
      position: {
        ...defaultAppSettings.lastWindowState.position,
        ...position
      }
    }
  };
};

export class AppStorage {
  public constructor(private readonly adapter: StorageAdapter) {}

  public async initialize(): Promise<void> {
    await Promise.all(storageKeys.map((key) => this.read(key)));

    const settings = await this.getSettings();
    await this.saveSettings(settings);
  }

  public async getSettings(): Promise<AppSettings> {
    return normalizeSettings(await this.read('settings'));
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    await this.write('settings', normalizeSettings(settings));
  }

  public async getCharacters(): Promise<CharacterInstanceCollection> {
    const characters = await this.read('characters');
    return Array.isArray(characters) ? characters : cloneStorageValue(defaultStorageData.characters);
  }

  public async saveCharacters(characters: CharacterInstanceCollection): Promise<void> {
    await this.write('characters', Array.isArray(characters) ? characters : defaultStorageData.characters);
  }

  public async getMotions(): Promise<MotionProfile[]> {
    const motions = await this.read('motions');
    return Array.isArray(motions) ? motions : cloneStorageValue(defaultStorageData.motions);
  }

  public async saveMotions(motions: MotionProfile[]): Promise<void> {
    await this.write('motions', Array.isArray(motions) ? motions : defaultStorageData.motions);
  }

  public async getCalendarRules(): Promise<CalendarReactionRule[]> {
    const calendarRules = await this.read('calendarRules');
    return Array.isArray(calendarRules) ? calendarRules : cloneStorageValue(defaultStorageData.calendarRules);
  }

  public async saveCalendarRules(calendarRules: CalendarReactionRule[]): Promise<void> {
    await this.write('calendarRules', Array.isArray(calendarRules) ? calendarRules : defaultStorageData.calendarRules);
  }

  private async read<TKey extends StorageKey>(key: TKey): Promise<StorageDataMap[TKey]> {
    return this.adapter.read(key, cloneStorageValue(defaultStorageData[key]));
  }

  private async write<TKey extends StorageKey>(key: TKey, value: StorageDataMap[TKey]): Promise<void> {
    await this.adapter.write(key, cloneStorageValue(value));
  }
}

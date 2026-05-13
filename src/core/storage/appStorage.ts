import type { AppSettings } from '../settings/appSettings';
import { defaultAppSettings } from '../settings/appSettings';
import type { CalendarReactionRule } from '../calendar/calendarTypes';
import type {
  CharacterInstanceCollection,
  CharacterProfile,
  CharacterStorageData,
  CostumeProfile,
  ModelFormat,
  ModelProfile
} from '../character/characterTypes';
import type { MotionFormat, MotionProfile } from '../motion/motionTypes';
import { defaultStorageData } from './defaultStorageData';
import type { StorageAdapter, StorageDataMap, StorageKey } from './storageAdapter';
import { storageKeys } from './storageAdapter';

const cloneStorageValue = <TValue>(value: TValue): TValue => JSON.parse(JSON.stringify(value)) as TValue;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isClickThroughMode = (value: unknown): value is AppSettings['clickThroughMode'] =>
  value === 'window' || value === 'characterOnlyFuture';

const isModelFormat = (value: unknown): value is ModelFormat => value === 'pmx' || value === 'vrm';

const isMotionFormat = (value: unknown): value is MotionFormat =>
  value === 'vmd' || value === 'vrma' || value === 'none';

const isDefined = <TValue>(value: TValue | undefined): value is TValue => value !== undefined;

const normalizeModelFormats = (value: unknown, fallbackValue: ModelFormat[]): ModelFormat[] => {
  if (!Array.isArray(value)) {
    return [...fallbackValue];
  }

  const formats = value.filter(isModelFormat);
  return formats.length > 0 ? formats : [...fallbackValue];
};

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

const normalizeModelProfile = (value: unknown): ModelProfile | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const modelId = typeof value.modelId === 'string' ? value.modelId : undefined;

  if (!modelId) {
    return undefined;
  }

  const displayName = typeof value.displayName === 'string' ? value.displayName : modelId;
  const modelFormat = isModelFormat(value.modelFormat) ? value.modelFormat : 'pmx';
  const modelPath =
    typeof value.modelPath === 'string'
      ? value.modelPath
      : typeof value.pmxPath === 'string'
        ? value.pmxPath
        : '';

  const profile: ModelProfile = {
    modelId,
    displayName,
    modelFormat,
    modelPath
  };

  if (typeof value.textureRootPath === 'string') {
    profile.textureRootPath = value.textureRootPath;
  }

  if (typeof value.description === 'string') {
    profile.description = value.description;
  }

  return profile;
};

const normalizeCharacterProfile = (value: unknown): CharacterProfile | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const characterId = typeof value.characterId === 'string' ? value.characterId : undefined;

  if (!characterId) {
    return undefined;
  }

  return {
    characterId,
    displayName: typeof value.displayName === 'string' ? value.displayName : characterId,
    basePrompt: typeof value.basePrompt === 'string' ? value.basePrompt : '',
    modelProfiles: Array.isArray(value.modelProfiles)
      ? value.modelProfiles.map(normalizeModelProfile).filter(isDefined)
      : [],
    costumes: Array.isArray(value.costumes) ? (value.costumes as CostumeProfile[]) : [],
    voiceProfiles: Array.isArray(value.voiceProfiles) ? (value.voiceProfiles as CharacterProfile['voiceProfiles']) : [],
    defaultCostumeId: typeof value.defaultCostumeId === 'string' ? value.defaultCostumeId : ''
  };
};

const normalizeCharacterInstances = (value: unknown): CharacterInstanceCollection => {
  if (!Array.isArray(value)) {
    return cloneStorageValue(defaultStorageData.characters.instances);
  }

  return value as CharacterInstanceCollection;
};

const normalizeCharacterStorage = (value: unknown): CharacterStorageData => {
  if (Array.isArray(value)) {
    return {
      profiles: cloneStorageValue(defaultStorageData.characters.profiles),
      instances: normalizeCharacterInstances(value)
    };
  }

  if (!isRecord(value)) {
    return cloneStorageValue(defaultStorageData.characters);
  }

  const normalizedProfiles = Array.isArray(value.profiles)
    ? value.profiles.map(normalizeCharacterProfile).filter(isDefined)
    : [];

  return {
    profiles:
      normalizedProfiles.length > 0 ? normalizedProfiles : cloneStorageValue(defaultStorageData.characters.profiles),
    instances: normalizeCharacterInstances(value.instances)
  };
};

const getDefaultSupportedModelFormats = (motionFormat: MotionFormat): ModelFormat[] => {
  if (motionFormat === 'vrma') {
    return ['vrm'];
  }

  if (motionFormat === 'none') {
    return ['pmx', 'vrm'];
  }

  return ['pmx'];
};

const normalizeMotionProfile = (value: unknown): MotionProfile | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const motionId = typeof value.motionId === 'string' ? value.motionId : undefined;

  if (!motionId) {
    return undefined;
  }

  const motionPath =
    typeof value.motionPath === 'string'
      ? value.motionPath
      : typeof value.vmdPath === 'string'
        ? value.vmdPath
        : undefined;
  const motionFormat = isMotionFormat(value.motionFormat) ? value.motionFormat : motionPath ? 'vmd' : 'none';
  const normalizedMotion: MotionProfile = {
    motionId,
    displayName: typeof value.displayName === 'string' ? value.displayName : motionId,
    motionFormat,
    state: typeof value.state === 'string' ? (value.state as MotionProfile['state']) : 'idleStanding',
    supportedModelFormats: normalizeModelFormats(
      value.supportedModelFormats,
      getDefaultSupportedModelFormats(motionFormat)
    )
  };

  if (motionPath) {
    normalizedMotion.motionPath = motionPath;
  }

  if (Array.isArray(value.tags)) {
    normalizedMotion.tags = value.tags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (Array.isArray(value.preferredSeasons)) {
    normalizedMotion.preferredSeasons = value.preferredSeasons as MotionProfile['preferredSeasons'];
  }

  if (Array.isArray(value.preferredTimeRanges)) {
    normalizedMotion.preferredTimeRanges = value.preferredTimeRanges as MotionProfile['preferredTimeRanges'];
  }

  if (Array.isArray(value.preferredCostumeIds)) {
    normalizedMotion.preferredCostumeIds = value.preferredCostumeIds.filter(
      (costumeId): costumeId is string => typeof costumeId === 'string'
    );
  }

  if (typeof value.weight === 'number') {
    normalizedMotion.weight = value.weight;
  }

  return normalizedMotion;
};

const normalizeMotions = (value: unknown): MotionProfile[] => {
  if (!Array.isArray(value)) {
    return cloneStorageValue(defaultStorageData.motions);
  }

  return value.map(normalizeMotionProfile).filter(isDefined);
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

  public async getCharacters(): Promise<CharacterStorageData> {
    const characters = await this.read('characters');
    return normalizeCharacterStorage(characters);
  }

  public async saveCharacters(characters: CharacterStorageData): Promise<void> {
    await this.write('characters', normalizeCharacterStorage(characters));
  }

  public async getMotions(): Promise<MotionProfile[]> {
    const motions = await this.read('motions');
    return normalizeMotions(motions);
  }

  public async saveMotions(motions: MotionProfile[]): Promise<void> {
    await this.write('motions', normalizeMotions(motions));
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

export type { DesktopMascotApi, DesktopMascotStorageApi } from './app/desktopMascotApi';
export type { AppInfo } from './app/appInfo';
export type {
  CharacterInstance,
  CharacterInstanceCollection,
  CharacterProfile,
  CharacterStorageData,
  CostumeChangeAnimation,
  CostumeProfile,
  ModelFormat,
  ModelProfile,
  PerformanceProfile,
  ScreenPosition
} from './character/characterTypes';
export type { MascotState } from './mascot/mascotState';
export type { CalendarReactionRule, Season, TimeRangeKey, Weekday } from './calendar/calendarTypes';
export type { MotionFormat, MotionProfile } from './motion/motionTypes';
export type { ModelRendererAdapter, LookAtTarget } from './renderer/modelRendererTypes';
export type { AIAdapter } from './ai/aiAdapter';
export type { MascotAIRequest, MascotAIResponse } from './ai/aiTypes';
export type { SpeechBubbleAction, SpeechBubbleActionType, SpeechBubbleContent } from './speech/speechTypes';
export type { VoiceAdapter } from './voice/voiceAdapter';
export type { VoiceDirection, VoiceProfile } from './voice/voiceTypes';
export type { ScreenObservationAdapter, ScreenObservationResult } from './screen/screenObservationAdapter';
export type { TextReadingAdapter, TextReadingResult } from './reading/textReadingAdapter';
export type { AppSettings, CostumeChangeSettings } from './settings/appSettings';
export { defaultAppSettings } from './settings/appSettings';
export type { StorageAdapter, StorageDataMap, StorageKey } from './storage/storageAdapter';
export { storageKeys } from './storage/storageAdapter';
export {
  defaultCalendarRules,
  defaultCharacterData,
  defaultCharacterInstances,
  defaultCharacterProfiles,
  defaultMotions,
  defaultStorageData
} from './storage/defaultStorageData';

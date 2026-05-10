export type StorageKey = 'settings' | 'characters' | 'motions' | 'calendarRules';

export interface StorageAdapter {
  read<TValue>(key: StorageKey, fallbackValue: TValue): Promise<TValue>;
  write<TValue>(key: StorageKey, value: TValue): Promise<void>;
}

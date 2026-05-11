import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageAdapter, StorageDataMap, StorageKey } from '../../core/storage/storageAdapter';

const storageFileNames: Record<StorageKey, string> = {
  settings: 'settings.json',
  characters: 'characters.json',
  motions: 'motions.json',
  calendarRules: 'calendarRules.json'
};

const cloneStorageValue = <TValue>(value: TValue): TValue => JSON.parse(JSON.stringify(value)) as TValue;

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error;

export class JsonFileStorageAdapter implements StorageAdapter {
  public constructor(private readonly storageRoot: string) {}

  public async read<TKey extends StorageKey>(
    key: TKey,
    fallbackValue: StorageDataMap[TKey]
  ): Promise<StorageDataMap[TKey]> {
    await this.ensureStorageRoot();

    const filePath = this.getFilePath(key);

    try {
      const rawValue = await fs.readFile(filePath, 'utf8');
      return JSON.parse(rawValue) as StorageDataMap[TKey];
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        await this.writeFallbackFile(key, fallbackValue);
        return cloneStorageValue(fallbackValue);
      }

      console.error(`Failed to read storage file: ${filePath}`, error);
      return cloneStorageValue(fallbackValue);
    }
  }

  public async write<TKey extends StorageKey>(key: TKey, value: StorageDataMap[TKey]): Promise<void> {
    await this.ensureStorageRoot();

    const filePath = this.getFilePath(key);
    const serializedValue = `${JSON.stringify(value, null, 2)}\n`;

    try {
      await fs.writeFile(filePath, serializedValue, 'utf8');
    } catch (error: unknown) {
      console.error(`Failed to write storage file: ${filePath}`, error);
      throw error;
    }
  }

  private async writeFallbackFile<TKey extends StorageKey>(
    key: TKey,
    fallbackValue: StorageDataMap[TKey]
  ): Promise<void> {
    try {
      await this.write(key, fallbackValue);
    } catch (error: unknown) {
      console.error(`Failed to create fallback storage file: ${this.getFilePath(key)}`, error);
    }
  }

  private getFilePath(key: StorageKey): string {
    return path.join(this.storageRoot, storageFileNames[key]);
  }

  private async ensureStorageRoot(): Promise<void> {
    await fs.mkdir(this.storageRoot, { recursive: true });
  }
}

import { app, ipcMain } from 'electron';
import type { AppInfo } from '../../core/app/appInfo';
import type { AppSettings, CalendarReactionRule, CharacterStorageData, MotionProfile } from '../../core';
import type { AppStorage } from '../../core/storage/appStorage';

type IpcHandlerOptions = {
  onSettingsSaved?: (settings: AppSettings) => void;
};

export const registerIpcHandlers = (storage: AppStorage, options: IpcHandlerOptions = {}): void => {
  ipcMain.handle('app:get-info', (): AppInfo => {
    return {
      appName: app.getName(),
      version: app.getVersion()
    };
  });

  ipcMain.handle('storage:get-settings', () => storage.getSettings());
  ipcMain.handle('storage:save-settings', async (_event, settings: AppSettings) => {
    await storage.saveSettings(settings);
    options.onSettingsSaved?.(await storage.getSettings());
  });
  ipcMain.handle('storage:get-characters', () => storage.getCharacters());
  ipcMain.handle('storage:save-characters', (_event, characters: CharacterStorageData) =>
    storage.saveCharacters(characters)
  );
  ipcMain.handle('storage:get-motions', () => storage.getMotions());
  ipcMain.handle('storage:save-motions', (_event, motions: MotionProfile[]) => storage.saveMotions(motions));
  ipcMain.handle('storage:get-calendar-rules', () => storage.getCalendarRules());
  ipcMain.handle('storage:save-calendar-rules', (_event, calendarRules: CalendarReactionRule[]) =>
    storage.saveCalendarRules(calendarRules)
  );
};

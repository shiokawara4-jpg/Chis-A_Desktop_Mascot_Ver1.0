import { app, BrowserWindow } from 'electron';
import type { AppSettings } from '../core';
import { defaultAppSettings } from '../core';
import { AppStorage } from '../core/storage/appStorage';
import { registerIpcHandlers } from './ipc/ipcHandlers';
import { JsonFileStorageAdapter } from './storage/jsonFileStorageAdapter';
import { applyAlwaysOnTopSetting, createMainWindow } from './window/createMainWindow';

const readSettingsForWindow = async (storage: AppStorage): Promise<AppSettings> => {
  try {
    return await storage.getSettings();
  } catch (error: unknown) {
    console.error('Failed to read settings for window creation. Using default settings.', error);
    return defaultAppSettings;
  }
};

const createWindowFromStorage = async (storage: AppStorage): Promise<BrowserWindow> => {
  return createMainWindow(await readSettingsForWindow(storage));
};

const applyAlwaysOnTopToOpenWindows = (settings: AppSettings): void => {
  BrowserWindow.getAllWindows().forEach((window) => {
    applyAlwaysOnTopSetting(window, settings);
  });
};

const startApp = async (): Promise<void> => {
  await app.whenReady();

  const storage = new AppStorage(new JsonFileStorageAdapter(app.getPath('userData')));

  try {
    await storage.initialize();
  } catch (error: unknown) {
    console.error('Failed to initialize storage. The app will continue with runtime fallbacks.', error);
  }

  registerIpcHandlers(storage, {
    onSettingsSaved: applyAlwaysOnTopToOpenWindows
  });

  await createWindowFromStorage(storage);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindowFromStorage(storage);
    }
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

startApp().catch((error: unknown) => {
  console.error('Failed to start application.', error);
  app.quit();
});

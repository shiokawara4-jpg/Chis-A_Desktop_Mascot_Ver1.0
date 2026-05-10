import { app, ipcMain } from 'electron';
import type { AppInfo } from '../../core/app/appInfo';

export const registerIpcHandlers = (): void => {
  ipcMain.handle('app:get-info', (): AppInfo => {
    return {
      appName: app.getName(),
      version: app.getVersion()
    };
  });
};

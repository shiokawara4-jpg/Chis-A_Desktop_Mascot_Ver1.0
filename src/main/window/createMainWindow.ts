import { BrowserWindow } from 'electron';
import path from 'node:path';
import type { AppSettings } from '../../core/settings/appSettings';

const getBuiltAssetRoot = (): string => path.join(__dirname, '..', '..');

const getPreloadPath = (): string => path.join(getBuiltAssetRoot(), 'preload', 'preload.js');

const opaqueWindowBackgroundColor = '#f6f8fb';
const transparentWindowBackgroundColor = '#00000000';

export const applyAlwaysOnTopSetting = (window: BrowserWindow, settings: Pick<AppSettings, 'alwaysOnTop'>): void => {
  try {
    window.setAlwaysOnTop(settings.alwaysOnTop);
  } catch (error: unknown) {
    console.error('Failed to apply alwaysOnTop setting.', error);
  }
};

const loadRenderer = async (window: BrowserWindow): Promise<void> => {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  try {
    if (devServerUrl) {
      await window.loadURL(devServerUrl);
      return;
    }

    await window.loadFile(path.join(getBuiltAssetRoot(), 'renderer', 'index.html'));
  } catch (error: unknown) {
    console.error('Failed to load renderer.', error);
  }
};

export const createMainWindow = async (settings: AppSettings): Promise<BrowserWindow> => {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    show: false,
    frame: false,
    transparent: settings.transparentBackground,
    backgroundColor: settings.transparentBackground ? transparentWindowBackgroundColor : opaqueWindowBackgroundColor,
    alwaysOnTop: settings.alwaysOnTop,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  applyAlwaysOnTopSetting(mainWindow, settings);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  await loadRenderer(mainWindow);
  return mainWindow;
};

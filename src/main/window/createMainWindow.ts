import { BrowserWindow } from 'electron';
import path from 'node:path';

const getBuiltAssetRoot = (): string => path.join(__dirname, '..', '..');

const getPreloadPath = (): string => path.join(getBuiltAssetRoot(), 'preload', 'preload.js');

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

export const createMainWindow = async (): Promise<BrowserWindow> => {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    show: false,
    backgroundColor: '#f6f8fb',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  await loadRenderer(mainWindow);
  return mainWindow;
};

import type { CostumeChangeAnimation, ScreenPosition } from '../character/characterTypes';

export type CostumeChangeSettings = {
  allowUserChange: boolean;
  allowCharacterSuggestion: boolean;
  allowAutoChange: boolean;
  requireUserConfirmation: boolean;
  defaultAnimation: CostumeChangeAnimation | 'costumeDefault';
};

export type AppSettings = {
  language: 'ja' | 'en';
  alwaysOnTop: boolean;
  transparentBackground: boolean;
  launchAtStartup: boolean;
  clickThroughMode: 'window' | 'characterOnlyFuture';
  physicsEnabled: boolean;
  maxFps: number;
  renderScale: number;
  defaultCharacterInstanceId?: string;
  costumeChange: CostumeChangeSettings;
  lastWindowState: {
    position: ScreenPosition;
    scale: number;
    costumeId: string;
  };
};

export const defaultAppSettings: AppSettings = {
  language: 'ja',
  alwaysOnTop: false,
  transparentBackground: true,
  launchAtStartup: false,
  clickThroughMode: 'window',
  physicsEnabled: true,
  maxFps: 60,
  renderScale: 1,
  defaultCharacterInstanceId: 'main-character',
  costumeChange: {
    allowUserChange: true,
    allowCharacterSuggestion: false,
    allowAutoChange: false,
    requireUserConfirmation: true,
    defaultAnimation: 'costumeDefault'
  },
  lastWindowState: {
    position: { x: 160, y: 260 },
    scale: 1,
    costumeId: 'default'
  }
};

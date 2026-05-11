import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopMascotApi } from '../core/app/desktopMascotApi';

const invoke = <TValue>(channel: string, ...args: unknown[]): Promise<TValue> =>
  ipcRenderer.invoke(channel, ...args) as Promise<TValue>;

const desktopMascotApi: DesktopMascotApi = {
  getAppInfo: () => invoke('app:get-info'),
  storage: {
    getSettings: () => invoke('storage:get-settings'),
    saveSettings: (settings) => invoke('storage:save-settings', settings),
    getCharacters: () => invoke('storage:get-characters'),
    saveCharacters: (characters) => invoke('storage:save-characters', characters),
    getMotions: () => invoke('storage:get-motions'),
    saveMotions: (motions) => invoke('storage:save-motions', motions),
    getCalendarRules: () => invoke('storage:get-calendar-rules'),
    saveCalendarRules: (calendarRules) => invoke('storage:save-calendar-rules', calendarRules)
  }
};

contextBridge.exposeInMainWorld('desktopMascot', desktopMascotApi);

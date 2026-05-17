import { app, ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AppInfo } from '../../core/app/appInfo';
import type {
  AppSettings,
  CalendarReactionRule,
  CharacterStorageData,
  MotionProfile,
  RendererDiagnosticEntry
} from '../../core';
import type { AppStorage } from '../../core/storage/appStorage';

type IpcHandlerOptions = {
  onSettingsSaved?: (settings: AppSettings) => void;
};

const rendererErrorLogFileName = 'renderer-errors.log';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeRendererDiagnosticEntry = (entry: unknown): RendererDiagnosticEntry => {
  const candidate = isRecord(entry) ? entry : {};
  const level = candidate.level === 'warning' || candidate.level === 'error' ? candidate.level : 'error';
  const source = typeof candidate.source === 'string' && candidate.source.trim() ? candidate.source : 'renderer';
  const message = typeof candidate.message === 'string' && candidate.message.trim() ? candidate.message : 'Renderer error';

  return {
    level,
    source,
    message,
    details: candidate.details,
    occurredAt: typeof candidate.occurredAt === 'string' ? candidate.occurredAt : new Date().toISOString()
  };
};

const appendRendererDiagnosticLog = async (entry: RendererDiagnosticEntry): Promise<void> => {
  const logRoot = path.join(app.getPath('userData'), 'logs');
  const logPath = path.join(logRoot, rendererErrorLogFileName);
  const record = {
    ...entry,
    process: 'renderer'
  };

  await fs.mkdir(logRoot, { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(record)}\n`, 'utf8');
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
  ipcMain.handle('diagnostics:log-renderer-error', async (_event, entry: unknown) => {
    try {
      await appendRendererDiagnosticLog(normalizeRendererDiagnosticEntry(entry));
    } catch (error: unknown) {
      console.error('Failed to append renderer diagnostic log.', error);
    }
  });
};

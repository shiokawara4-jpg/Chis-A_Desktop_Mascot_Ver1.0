import type { AppInfo } from './appInfo';

export type DesktopMascotApi = {
  getAppInfo: () => Promise<AppInfo>;
};

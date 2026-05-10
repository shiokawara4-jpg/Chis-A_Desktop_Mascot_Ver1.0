import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopMascotApi } from '../core/app/desktopMascotApi';

const desktopMascotApi: DesktopMascotApi = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info') as Promise<Awaited<ReturnType<DesktopMascotApi['getAppInfo']>>>
};

contextBridge.exposeInMainWorld('desktopMascot', desktopMascotApi);

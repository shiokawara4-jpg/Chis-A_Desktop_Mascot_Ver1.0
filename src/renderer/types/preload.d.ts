import type { DesktopMascotApi } from '../../core/app/desktopMascotApi';

declare global {
  interface Window {
    desktopMascot: DesktopMascotApi;
  }
}

export {};

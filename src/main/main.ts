import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './ipc/ipcHandlers';
import { createMainWindow } from './window/createMainWindow';

const startApp = async (): Promise<void> => {
  registerIpcHandlers();

  await app.whenReady();
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
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

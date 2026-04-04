// @ts-nocheck - This file uses electron types which are not available in electrobun
import { app, BrowserWindow } from 'electron';
import { join } from 'path';

export class ElectrobunApp {
  private mainWindow: BrowserWindow | null = null;

  async initialize(): Promise<void> {
    await app.whenReady();
    this.createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

// Optimize memory and CPU footprint
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 780,
    minWidth: 800,
    minHeight: 560,
    backgroundColor: '#09090b',
    title: 'App Launcher',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = 'http://localhost:3300';
  const prodIndex = path.join(__dirname, '../dist/index.html');

  if (isDev && !fs.existsSync(prodIndex)) {
    mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(prodIndex)) {
    mainWindow.loadFile(prodIndex);
  } else {
    mainWindow.loadURL(devUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    setupIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpc() {
  // Read local catalog file
  ipcMain.handle('catalog:read-local', async (_, filePath) => {
    try {
      const target = filePath || path.join(__dirname, '../public/apps.json');
      const content = fs.readFileSync(target, 'utf-8');
      return { ok: true, data: JSON.parse(content) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Save local catalog file
  ipcMain.handle('catalog:save-local', async (_, { filePath, data }) => {
    try {
      const target = filePath || path.join(__dirname, '../public/apps.json');
      fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf-8');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Launch application
  ipcMain.handle('app:launch', async (_, { command, appName }) => {
    return new Promise((resolve) => {
      if (!command) {
        return resolve({ ok: false, error: 'No command specified' });
      }

      try {
        const proc = exec(command, (err) => {
          if (err) {
            console.error(`Error launching ${appName}:`, err);
          }
        });
        proc.unref();
        resolve({ ok: true, message: `Launched ${appName || command}` });
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    });
  });

  // Open external URL
  ipcMain.handle('system:open-url', async (_, url) => {
    try {
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // System info
  ipcMain.handle('system:info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
    };
  });
}

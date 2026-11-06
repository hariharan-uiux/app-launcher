const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readLocalCatalog: (filePath) => ipcRenderer.invoke('catalog:read-local', filePath),
  saveLocalCatalog: (filePath, data) => ipcRenderer.invoke('catalog:save-local', { filePath, data }),
  launchApp: (command, appName) => ipcRenderer.invoke('app:launch', { command, appName }),
  openExternalUrl: (url) => ipcRenderer.invoke('system:open-url', url),
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
});

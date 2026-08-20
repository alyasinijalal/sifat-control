const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemHWID: () => ipcRenderer.invoke('get-system-hwid'),
});

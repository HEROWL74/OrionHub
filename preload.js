// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectOrionRoot: () => ipcRenderer.invoke('select-orion-root'),
  getOrionRoot: () => ipcRenderer.invoke('get-orion-root'),
  getEngineVersions: () => ipcRenderer.invoke('get-engine-versions')
});

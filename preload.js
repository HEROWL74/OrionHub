// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectOrionRoot: () => ipcRenderer.invoke('select-orion-root'),
  getOrionRoot: () => ipcRenderer.invoke('get-orion-root'),
  getEngineVersions: () => ipcRenderer.invoke('get-engine-versions'),
  installEngine: (version) => ipcRenderer.invoke('install-engine', version),
  createProject: (data) => ipcRenderer.invoke('create-project', data),
  openProject: (name) => ipcRenderer.invoke('openProject', name),
  getProjects: () => ipcRenderer.invoke('get-projects')
});

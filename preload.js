// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// api経由のイベント発火メソッド
contextBridge.exposeInMainWorld('api', {
  // Engine,Projectを作るためのフォルダルート
  selectOrionRoot: () => ipcRenderer.invoke('select-orion-root'),
  getOrionRoot: () => ipcRenderer.invoke('get-orion-root'),
  // Engine バージョン取得
  getEngineVersions: () => ipcRenderer.invoke('get-engine-versions'),
  // InstallするEngine 
  installEngine: (version) => ipcRenderer.invoke('install-engine', version),
  // プロジェクト作成
  createProject: (data) => ipcRenderer.invoke('create-project', data),
  // プロジェクト立ち上げ
  openProject: (name) => ipcRenderer.invoke('openProject', name),
  // プロジェクト情報 Getter
  getProjects: () => ipcRenderer.invoke('get-projects')
});

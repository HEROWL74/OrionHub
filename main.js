// main.js
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { hostname } = require('os');

let win;

function getConfigPath()
{
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig()
{
  const p = getConfigPath();
  if(!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveConfig(config)
{
  fs.writeFileSync(
    getConfigPath(),
    JSON.stringify(config, null, 2)
  );
}

function ensureDir(p)
{
  if(!fs.existsSync(p)){
    fs.mkdirSync(p, {recursive: true});
  }
}

function setupOrionRoot(orionRoot)
{
  ensureDir(path.join(orionRoot, 'versions'));
  ensureDir(path.join(orionRoot, 'projects'));
  ensureDir(path.join(orionRoot, 'cache'));
  ensureDir(path.join(orionRoot, 'logs'));
}

function fetchReleases()
{
    return new Promise((resolve, reject) => {
      const options = 
      {
        hostname: 'api.github.com',
        path: '/repos/HEROWL74/OrionEngine/releases',
        headers: {
          'User-Agent' : 'OrionHub'
        }
      };

      https.get(options,(res) => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try{
            const json = JSON.parse(data);
            resolve(json);
          }catch(e){
            reject(e);
          }
        });
      }).on('error', reject);
    });
}

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: __dirname + '/preload.js'
    }
  });

  win.loadFile('index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

ipcMain.handle('select-orion-root', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });

  const orionRoot = result.filePaths[0];

  if(result.canceled) return null;

  setupOrionRoot(orionRoot);
  saveConfig({orionRoot});

  return orionRoot;
});

ipcMain.handle('get-orion-root', () => {
  const config = loadConfig();
  if(!config.orionRoot) return null;

  setupOrionRoot(config.orionRoot);
  return config?.orionRoot ?? null;
})

ipcMain.handle('get-engine-versions', async() => {
  const releases = await fetchReleases();

  return releases.map(r => ({
    tag: r.tag_name,
    name: r.name,
    publishedAt: r.published_at
  }));
});
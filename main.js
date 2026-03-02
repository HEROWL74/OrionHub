// main.js
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { hostname, version } = require('os');
const { resolve } = require('dns');
const AdmZip = require('adm-zip');
const {spawn} = require('child_process');
const { error } = require('console');

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
}

async function downloadFile(url, destPath) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'OrionHub' }
  });

  if (!response.ok) {
    throw new Error(`ダウンロード失敗: ${response.statusText}`);
  }

  const fileStream = fs.createWriteStream(destPath);
  
  const { finished } = require('stream/promises');
  const { Readable } = require('stream');

  // response.body (ReadableStream) をファイルへ書き込み
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
}

function copyDir(src,dest)
{
  if(!fs.existsSync(src))
  {
    throw new Error("Template not found: " + src);
  }

  fs.mkdirSync(dest, {recursive: true});

  const entries = fs.readdirSync(src, {withFileTypes: true});

  for(const entry of entries)
  {
      const srcPath = path.join(src,entry.name);
      const destPath = path.join(dest, entry.name);

      if(entry.isDirectory())
      {
        copyDir(srcPath,destPath);
      }else{
        fs.copyFileSync(srcPath, destPath);
      }
  }
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

ipcMain.handle('get-engine-versions', async () => {
  const releases = await fetchReleases();
  const config = loadConfig();
  const orionRoot = config?.orionRoot;

  return releases
    .filter(r => 
      !r.draft && 
      !r.prerelease && 
      typeof r.tag_name === 'string' && 
      r.tag_name.startsWith('v')
    )
    .map(r => {
      const zipAsset = r.assets.find(a => a.name.endsWith('.zip'));
      
      // インストール済みかチェック
      let isInstalled = false;
      if (orionRoot) {
        const versionPath = path.join(orionRoot, 'versions', r.tag_name);
        // バージョンフォルダが存在し、かつエディタ（OrionEditor.exeなど）があるか
        isInstalled = fs.existsSync(versionPath); 
      }

      return {
        tag: r.tag_name,
        name: r.name ?? '',
        publishedAt: r.published_at,
        zipUrl: zipAsset?.browser_download_url ?? null,
        zipName: zipAsset?.name ?? null,
        installed: isInstalled // ここで結果を渡す
      };
    });
});

ipcMain.handle('install-engine', async (_, v) => {
  const config = loadConfig();
  if (!config?.orionRoot) return { success:false, error:'OrionRoot not set' };

  const versionDir = path.join(
    config.orionRoot,
    'versions',
    v.tag
  );

  ensureDir(versionDir);

  const zipPath = path.join(versionDir, 'engine.zip');

  if (!v.zipUrl) return { error: 'Zip URL missing' };

  await downloadFile(v.zipUrl, zipPath);

  new AdmZip(zipPath).extractAllTo(versionDir, true);
  fs.unlinkSync(zipPath);

  return { success: true };
});

ipcMain.handle('create-project', async (_, {projectName, engineTag}) => {
  try{
    const config = loadConfig();
    if(!config?.orionRoot)
      return { success:false, error:"OrionRoot not set" };

    const templateDir = path.join(
      app.getAppPath(),
      'project'
    );

    const projectDir = path.join(
      config.orionRoot,
      'projects',
      projectName
    );

    if(fs.existsSync(projectDir))
      return { success:false, error:'Project already exists' };

    copyDir(templateDir, projectDir);

    const settingsPath = path.join(projectDir, 'ProjectSettings.json');

    const json = JSON.parse(fs.readFileSync(settingsPath,'utf-8'));

    json.ProjectName = projectName;
    json.EngineVersion = engineTag;

    fs.writeFileSync(settingsPath, JSON.stringify(json,null,2));

    return { success:true };

  }catch(err){
    return { success:false, error:err.message };
  }
});

ipcMain.handle('openProject', async (_, projectName) => {
    try{
      const config = loadConfig();
      const orionRoot = config?.orionRoot;

      const projectPath = path.join(orionRoot, 'projects', projectName);

      const settings = JSON.parse(
        fs.readFileSync(
          path.join(projectPath, 'ProjectSettings.json'),
          'utf-8'
        )
      );

      const engineTag = settings.EngineVersion;

      const editorPath = path.join(
        orionRoot,
        'versions',
        engineTag,
        'OrionEditor.exe'
      );

      if(!fs.existsSync(editorPath))
      {
        return {success: false, error: 'Engine not installed'};
      }

      spawn(editorPath, ['--project', projectPath],{
        cwd: path.dirname(editorPath),
        detached: true
      });

      return {success:true};
    }catch(err)
    {
      return {success:false, error: err.message};
    }
});

ipcMain.handle('get-projects', async () => {
  try {
    const config = loadConfig();
    if(!config?.orionRoot)
      return [];

    const projectsDir = path.join(config.orionRoot, 'projects');

    if(!fs.existsSync(projectsDir))
      return [];

    const folders = fs.readdirSync(projectsDir);

    const projects = folders
        .map(name => {
          const settingsPath = path.join(
            projectsDir,
            name,
            'ProjectSettings.json'
          );

          if(!fs.existsSync(settingsPath))
            return null;

          const json = JSON.parse(
            fs.readFileSync(settingsPath, 'utf-8')
          );

          return {
            name,
            engineVersion: json.EngineVersion
          };
        }).filter(Boolean);

        return projects;
  }catch(err)
  {
    return [];
  }
});
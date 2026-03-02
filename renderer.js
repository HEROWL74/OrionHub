// renderer.js

// --- プロジェクト一覧の更新 (同期ロジック) ---
async function updateProjectList() {
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '';
    const projects = await window.api.getProjects();

    projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div style="font-weight:600;">${p.name}</div>
            <div style="font-size:12px; color:#9aa0aa;">Engine: ${p.engineVersion}</div>
        `;

        card.addEventListener('click', async () => {
            const result = await window.api.openProject(p.name);
            if (!result.success) alert(result.error);
        });

        projectList.appendChild(card);
    });
}

// --- エンジン一覧の初期化 ---
async function initEngineVersions() {
    const versions = await window.api.getEngineVersions();
    const container = document.getElementById('versions');
    const engineSelect = document.getElementById('engineSelect');

    container.innerHTML = ''; // 描画前に必ずクリア
    
    if (versions.length === 0) {
        container.textContent = 'No engine versions found.';
        return;
    }

    versions.forEach(v => {
        // カード生成
        const card = document.createElement('div');
        card.className = 'version-card' + (v.installed ? ' installed' : '');
        
        // フォルダが空なら Installed にならないように、API(v.installed)の結果を優先
        const statusText = v.installed ? ' (Installed)' : '';
        
        card.innerHTML = `
            <div class="version-tag">${v.tag}${statusText}</div>
            <div class="version-date">${new Date(v.publishedAt).toLocaleDateString()}</div>
        `;

        // インストール済みのものだけをセレクトボックスに追加
        if (v.installed) {
            const option = document.createElement('option');
            option.value = v.tag;
            option.textContent = v.tag;
            engineSelect.appendChild(option);
        }

        // インストールイベント
        card.addEventListener('click', async () => {
            if (v.installed) return;
            card.textContent = "Downloading...";
            const result = await window.api.installEngine(v);
            if (result.success) {
                // インストール完了後も全体をリフレッシュ
                await refreshAll();
            } else {
                card.textContent = 'Failed';
            }
        });

        container.appendChild(card);
    });
}

// --- イベント登録 ---

// フォルダ選択ボタン
async function selectOrionRoot() {
    const path = await window.api.selectOrionRoot();
    if (path) {
        // パス表示を更新
        document.getElementById('path').textContent = 'Current Orion Root: ' + path;
        
        // フォルダが変わったので、全てを再読み込みする
        await refreshAll();
    }
}

// プロジェクト作成ボタン
document.getElementById('createBtn').addEventListener('click', async () => {
    const projectName = document.getElementById('project-name').value.trim();
    const engineTag = document.getElementById('engineSelect').value;

    if (!projectName || !engineTag) {
        alert("Enter project name and select version");
        return;
    }

    const result = await window.api.createProject({ projectName, engineTag });
    if (result.success) {
        alert("Project created!");
        await updateProjectList();
        await window.api.openProject(projectName);
    } else {
        alert(result.error || "Failed");
    }
});

async function refreshAll() {
    console.log("Refreshing all data based on current Orion Root...");
    
    // セレクトボックスを一旦クリア（古いエンジンの選択肢を消す）
    const engineSelect = document.getElementById('engineSelect');
    engineSelect.innerHTML = '<option value="">Select Engine</option>';
    
    // エンジン一覧を再取得・再描画
    // getEngineVersionsの中で「installed」のチェックを再度行わせる
    await initEngineVersions();
    
    // プロジェクト一覧を再取得・再描画
    await updateProjectList();
}

// ウィンドウにフォーカスが戻った時の同期
window.addEventListener('focus', updateProjectList);

// 初回ロード
document.addEventListener('DOMContentLoaded', async () => {
    const path = await window.api.getOrionRoot();
    if(path) document.getElementById('path').textContent = 'Current Orion Root: ' + path;
    
    await initEngineVersions();
    await updateProjectList();
});
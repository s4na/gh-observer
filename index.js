#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const CONFIG_DIR = path.join(os.homedir(), '.config');
const CONFIG_FILE = path.join(CONFIG_DIR, 's4na-gh-observer.yaml');

// ログフォーマット関数: ログレベル、日時、内容を整形して出力
const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const log = (level, message) => {
  const now = new Date();
  const timestamp = formatTime(now);
  console.log(`${level} ${timestamp} ${message}`);
};

const ensureConfigFile = () => {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      log('INFO', `Created config directory: ${CONFIG_DIR}`);
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      const defaultConfig = {
        interval: 1000,
        showElapsedTime: true,
        timeFormat: '24h',
        createdAt: new Date().toISOString()
      };

      const yamlContent = yaml.dump(defaultConfig, {
        indent: 2,
        lineWidth: -1
      });

      fs.writeFileSync(CONFIG_FILE, yamlContent, 'utf8');
      log('INFO', `Created config file: ${CONFIG_FILE}`);
      return defaultConfig;
    } else {
      const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = yaml.load(fileContent);
      log('INFO', `Loaded config from: ${CONFIG_FILE}`);
      return config;
    }
  } catch (error) {
    log('ERROR', `Error handling config file: ${error.message}`);
    return {
      interval: 1000,
      showElapsedTime: true,
      timeFormat: '24h'
    };
  }
};

// ブラウザを開く関数
const openBrowser = (url) => {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    command = `open ${url}`;
  } else if (platform === 'win32') {
    command = `start ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }

  exec(command, (error) => {
    if (error) {
      log('ERROR', `ブラウザを開けませんでした: ${error.message}`);
    }
  });
};

// ghコマンドを使ってリポジトリ一覧を取得する関数
const fetchRepositories = async () => {
  try {
    log('INFO', 'リポジトリ情報を取得中...');

    // 自分のリポジトリを取得
    const { stdout: userRepos } = await execAsync('gh repo list --json name,url,description,owner --limit 100');
    const userReposList = JSON.parse(userRepos);

    // 所属している組織を取得
    const { stdout: orgsOutput } = await execAsync('gh api user/orgs --jq ".[].login"');
    const orgs = orgsOutput.trim().split('\n').filter(org => org);

    // 各組織のリポジトリを取得
    const orgRepos = [];
    for (const org of orgs) {
      try {
        const { stdout: orgReposOutput } = await execAsync(`gh repo list ${org} --json name,url,description,owner --limit 100`);
        const orgReposList = JSON.parse(orgReposOutput);
        orgRepos.push({
          org,
          repos: orgReposList
        });
      } catch (err) {
        log('WARN', `組織 ${org} のリポジトリ取得に失敗: ${err.message}`);
      }
    }

    log('INFO', `取得完了: 個人リポジトリ ${userReposList.length}件, 組織 ${orgs.length}件`);

    return {
      userRepos: userReposList,
      orgRepos
    };
  } catch (error) {
    log('ERROR', `リポジトリ情報の取得に失敗: ${error.message}`);
    return {
      userRepos: [],
      orgRepos: [],
      error: error.message
    };
  }
};

// HTMLコンテンツを生成する関数
const generateHTML = (elapsed, repoData) => {
  const renderRepoList = (repos) => {
    if (!repos || repos.length === 0) {
      return '<p class="no-repos">リポジトリがありません</p>';
    }
    return repos.map(repo => `
      <div class="repo-item">
        <div class="repo-name">
          <a href="${repo.url}" target="_blank">${repo.owner.login}/${repo.name}</a>
        </div>
        ${repo.description ? `<div class="repo-description">${repo.description}</div>` : ''}
      </div>
    `).join('');
  };

  const renderOrgRepos = (orgRepos) => {
    if (!orgRepos || orgRepos.length === 0) {
      return '<p class="no-repos">所属している組織がありません</p>';
    }
    return orgRepos.map(({ org, repos }) => `
      <div class="org-section">
        <h3 class="org-name">${org}</h3>
        ${renderRepoList(repos)}
      </div>
    `).join('');
  };

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Observer</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 2.5rem;
      text-align: center;
    }
    .elapsed-time {
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
      text-align: center;
      margin-bottom: 2rem;
      font-variant-numeric: tabular-nums;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }
    .org-section {
      margin-bottom: 2rem;
    }
    .org-name {
      color: #555;
      font-size: 1.4rem;
      margin-bottom: 0.8rem;
      padding-left: 1rem;
      border-left: 4px solid #764ba2;
    }
    .repo-item {
      padding: 1rem;
      margin-bottom: 0.8rem;
      background: #f8f9fa;
      border-radius: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .repo-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .repo-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
    }
    .repo-name a {
      color: #667eea;
      text-decoration: none;
    }
    .repo-name a:hover {
      text-decoration: underline;
    }
    .repo-description {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .no-repos {
      color: #999;
      font-style: italic;
      padding: 1rem;
      text-align: center;
    }
    .error-message {
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .info {
      margin-top: 2rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 GitHub Observer</h1>
    <div class="elapsed-time" id="elapsed">経過時間: ${elapsed}秒</div>

    ${repoData && repoData.error ? `<div class="error-message">エラー: ${repoData.error}</div>` : ''}

    <div class="section">
      <h2 class="section-title">🔑 個人リポジトリ</h2>
      <div id="user-repos">
        ${repoData ? renderRepoList(repoData.userRepos) : '<p class="no-repos">読み込み中...</p>'}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">🏢 組織のリポジトリ</h2>
      <div id="org-repos">
        ${repoData ? renderOrgRepos(repoData.orgRepos) : '<p class="no-repos">読み込み中...</p>'}
      </div>
    </div>

    <div class="info">
      このページは自動的に更新されます<br>
      停止するには、ターミナルで Ctrl+C を押してください
    </div>
  </div>
  <script>
    // 1秒ごとに経過時間を更新
    setInterval(() => {
      fetch('/api/elapsed')
        .then(res => res.json())
        .then(data => {
          document.getElementById('elapsed').textContent = '経過時間: ' + data.elapsed + '秒';
        })
        .catch(err => console.error('更新エラー:', err));
    }, 1000);
  </script>
</body>
</html>
  `;
};

// 利用可能なポートを見つける関数
function findAvailablePort(startPort, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    const tryPort = () => {
      if (attempts >= maxAttempts) {
        reject(new Error(`利用可能なポートが見つかりませんでした (${startPort}-${startPort + maxAttempts - 1})`));
        return;
      }

      const testServer = http.createServer();

      testServer.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          currentPort++;
          tryPort();
        } else {
          reject(err);
        }
      });

      testServer.once('listening', () => {
        testServer.close(() => {
          resolve(currentPort);
        });
      });

      testServer.listen(currentPort);
    };

    tryPort();
  });
}

// サーバー起動関数
async function startServer(config, startTime) {
  try {
    // リポジトリデータを取得
    const repoData = await fetchRepositories();

    // 利用可能なポートを見つける
    const PORT = await findAvailablePort(3000);

    // HTTPサーバーを作成
    const server = http.createServer((req, res) => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      if (req.url === '/api/elapsed') {
        // API エンドポイント: 経過時間をJSON形式で返す
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ elapsed }));
      } else {
        // メインページ: HTMLを返す
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(generateHTML(elapsed, repoData));
      }
    });

    // エラーハンドリング
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log('ERROR', `ポート ${PORT} は既に使用されています`);
      } else {
        log('ERROR', `サーバーエラー: ${err.message}`);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      log('INFO', `Webサーバーを起動しました: http://localhost:${PORT}`);
      if (PORT !== 3000) {
        log('WARN', `ポート3000が使用中のため、ポート${PORT}を使用しています`);
      }
      // サーバー起動後にブラウザを開く
      openBrowser(`http://localhost:${PORT}`);
    });

    // ターミナルにも経過時間を表示し続ける
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      log('INFO', `経過時間: ${elapsed}秒`);
    }, config.interval || 1000);

    process.on('SIGINT', () => {
      clearInterval(timer);
      server.close(() => {
        log('INFO', '\nサーバーを停止しました');
        process.exit(0);
      });
    });
  } catch (error) {
    log('ERROR', `サーバーの起動に失敗しました: ${error.message}`);
    process.exit(1);
  }
}

// テストとして実行されているか確認
const isTestEnvironment = process.env.NODE_ENV === 'test';

// テスト用にエクスポート
if (isTestEnvironment) {
  module.exports = {
    formatTime,
    log,
    ensureConfigFile,
    openBrowser,
    generateHTML,
    CONFIG_DIR,
    CONFIG_FILE
  };
} else {
  // 通常実行時のみサーバーを起動
  const config = ensureConfigFile();
  const startTime = Date.now();
  startServer(config, startTime);
}

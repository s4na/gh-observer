#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');
const http = require('http');
const { exec } = require('child_process');

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

const config = ensureConfigFile();

const startTime = Date.now();

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

// HTMLコンテンツを生成する関数
const generateHTML = (elapsed) => {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Observer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      min-width: 400px;
    }
    h1 {
      color: #333;
      margin-bottom: 2rem;
      font-size: 2.5rem;
    }
    .elapsed-time {
      font-size: 4rem;
      font-weight: bold;
      color: #667eea;
      margin: 2rem 0;
      font-variant-numeric: tabular-nums;
    }
    .label {
      color: #666;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    .info {
      margin-top: 2rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 GitHub Observer</h1>
    <div class="label">経過時間</div>
    <div class="elapsed-time" id="elapsed">${elapsed}秒</div>
    <div class="info">
      このページは自動的に更新されます<br>
      停止するには、ターミナルで Ctrl+C を押してください
    </div>
  </div>
  <script>
    // 1秒ごとにページを更新
    setInterval(() => {
      fetch('/api/elapsed')
        .then(res => res.json())
        .then(data => {
          document.getElementById('elapsed').textContent = data.elapsed + '秒';
        })
        .catch(err => console.error('更新エラー:', err));
    }, 1000);
  </script>
</body>
</html>
  `;
};

// HTTPサーバーを作成
const PORT = 3000;
const server = http.createServer((req, res) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  if (req.url === '/api/elapsed') {
    // API エンドポイント: 経過時間をJSON形式で返す
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ elapsed }));
  } else {
    // メインページ: HTMLを返す
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateHTML(elapsed));
  }
});

server.listen(PORT, () => {
  log('INFO', `Webサーバーを起動しました: http://localhost:${PORT}`);
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

// サーバー実装モジュール
// HTTPサーバーの起動と管理を担当

const http = require('http');
const { log } = require('./logger');
const { openBrowser } = require('./browser');
const { generateHTML } = require('./html');
const { fetchRepositories } = require('./repository');
const { saveConfig } = require('./config');
const { findAvailablePort } = require('./port');
const { monitorRepositories } = require('./issue-monitor');

/**
 * HTTPサーバーを起動
 * @param {object} config - 設定オブジェクト
 * @param {number} startTime - サーバー起動時刻（ミリ秒）
 * @returns {Promise<void>}
 */
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
      } else if (req.url === '/api/repos') {
        // API エンドポイント: 現在の設定を反映したリポジトリ情報を返す
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          repoData,
          savedTargets: config.targets || []
        }));
      } else if (req.url === '/api/save-targets' && req.method === 'POST') {
        // API エンドポイント: リポジトリ選択を保存
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const previousTargets = config.targets || [];
            config.targets = data.targets || [];
            const success = saveConfig(config);

            // 設定が更新されたことをログに出力
            if (success) {
              log('INFO', `監視対象を更新しました: ${config.targets.length}件`);
              if (config.targets.length > 0) {
                log('INFO', `監視対象リポジトリ: ${config.targets.join(', ')}`);
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success }));
          } catch (error) {
            log('ERROR', `設定の保存に失敗: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        });
      } else {
        // メインページ: HTMLを返す
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(generateHTML(elapsed, repoData, config.targets || []));
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
      log('INFO', '停止するには Ctrl+C を押してください');
      // サーバー起動後にブラウザを開く
      openBrowser(`http://localhost:${PORT}`);
    });

    // Issue監視タイマー（1分に1回、設定されたリポジトリをチェック）
    const issueMonitorInterval = 60000; // 1分
    const issueTimer = setInterval(async () => {
      try {
        if (config.targets && config.targets.length > 0) {
          await monitorRepositories(config.targets);
        }
      } catch (error) {
        log('ERROR', `Issue監視エラー: ${error.message}`);
      }
    }, issueMonitorInterval);

    // Ctrl+C (SIGINT) でのグレースフルシャットダウン
    let isShuttingDown = false;
    const handleShutdown = () => {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;

      log('INFO', '\n停止処理を開始しています...');
      clearInterval(issueTimer);

      server.close(() => {
        log('INFO', 'サーバーを停止しました');
        process.exit(0);
      });

      // サーバーが5秒以内に停止しない場合は強制終了
      setTimeout(() => {
        log('WARN', 'サーバーの停止がタイムアウトしました。強制終了します。');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  } catch (error) {
    log('ERROR', `サーバーの起動に失敗しました: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  startServer
};

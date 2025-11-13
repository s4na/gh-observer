// ポート管理モジュール
// 利用可能なポートを検索する機能を担当

const http = require('http');

/**
 * 利用可能なポートを検索
 * @param {number} startPort - 検索開始ポート
 * @param {number} maxAttempts - 最大試行回数（デフォルト: 10）
 * @returns {Promise<number>} 利用可能なポート番号
 * @throws {Error} 利用可能なポートが見つからない場合
 */
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

module.exports = {
  findAvailablePort
};

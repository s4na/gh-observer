#!/usr/bin/env node

// gh-observer CLI エントリーポイント
// 各機能モジュールを組み合わせてアプリケーションを実行

const { ensureConfigFile } = require('./src/config');
const { startServer } = require('./src/server');
const { log } = require('./src/logger');

// コマンドライン引数を解析
const args = process.argv.slice(2);
const isDebugMode = args.includes('-d') || args.includes('--debug');

// グローバルデバッグモードフラグを設定
global.debugMode = isDebugMode;

if (isDebugMode) {
  log('INFO', '🐛 デバッグモードを有効化しました。ghコマンドの実行が記録されます。');
}

// アプリケーションのメインロジック
async function main() {
  // 設定ファイルを確保（存在しなければ作成）
  const config = ensureConfigFile();

  // サーバーを起動（開始時刻をマーク）
  const startTime = Date.now();
  await startServer(config, startTime);
}

// アプリケーション実行
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

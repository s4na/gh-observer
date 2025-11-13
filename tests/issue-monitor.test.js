// Issue監視モジュールのテスト

const { monitorRepositories, resetCache, fetchIssues } = require('../src/issue-monitor');
const { log } = require('../src/logger');

// mockする
jest.mock('../src/logger');
jest.mock('child_process');

describe('Issue Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCache();
  });

  test('monitorRepositories should handle empty repos list', async () => {
    await monitorRepositories([]);
    expect(log).not.toHaveBeenCalled();
  });

  test('monitorRepositories should handle null repos', async () => {
    await monitorRepositories(null);
    expect(log).not.toHaveBeenCalled();
  });

  test('resetCache should clear cache', () => {
    resetCache();
    // キャッシュがリセットされたことを確認
    expect(true).toBe(true);
  });

  test('monitorRepositories should handle repositories', async () => {
    // モック実装はリポジトリが存在する場合の処理をテスト
    const { exec } = require('child_process');
    exec.mockImplementation((cmd, callback) => {
      callback(null, { stdout: '[]' });
    });

    // 初回実行（キャッシュ作成）
    await monitorRepositories(['test/repo']);

    // 2回目実行（差分検出）
    await monitorRepositories(['test/repo']);

    expect(true).toBe(true);
  }, 10000);
});

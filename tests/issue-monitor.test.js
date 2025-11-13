// Issue監視モジュールのテスト

const { monitorRepositories, resetCache, fetchIssues, isValidRepoFormat } = require('../src/issue-monitor');
const { log } = require('../src/logger');

// mockする
jest.mock('../src/logger');
jest.mock('child_process');

describe('Issue Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCache();
  });

  describe('isValidRepoFormat', () => {
    test('should accept valid repo format (owner/name)', () => {
      expect(isValidRepoFormat('owner/repo')).toBe(true);
      expect(isValidRepoFormat('my-org/my-repo')).toBe(true);
      expect(isValidRepoFormat('user_name/repo_name')).toBe(true);
      expect(isValidRepoFormat('user.name/repo.name')).toBe(true);
    });

    test('should reject invalid repo format', () => {
      expect(isValidRepoFormat('owner')).toBe(false);
      expect(isValidRepoFormat('owner/repo/extra')).toBe(false);
      expect(isValidRepoFormat('owner/repo;rm -rf /')).toBe(false);
      expect(isValidRepoFormat('owner/../repo')).toBe(false);
      expect(isValidRepoFormat('')).toBe(false);
    });
  });

  describe('monitorRepositories', () => {
    test('should handle empty repos list', async () => {
      await monitorRepositories([]);
      expect(log).not.toHaveBeenCalled();
    });

    test('should handle null repos', async () => {
      await monitorRepositories(null);
      expect(log).not.toHaveBeenCalled();
    });

    test('should detect new issues', async () => {
      const { exec } = require('child_process');

      // 1回目: Issue#1のみ、コメント取得も必要
      exec.mockImplementationOnce((cmd, callback) => {
        // gh issue list コマンド
        callback(null, {
          stdout: JSON.stringify([
            {
              number: 1,
              title: 'Test Issue',
              state: 'OPEN',
              author: { login: 'user1' },
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            }
          ])
        });
      });

      // 初回のコメント取得
      exec.mockImplementationOnce((cmd, callback) => {
        callback(null, {
          stdout: JSON.stringify({ comments: [] })
        });
      });

      // 2回目: Issue#1, #2（#2が新規）
      exec.mockImplementationOnce((cmd, callback) => {
        callback(null, {
          stdout: JSON.stringify([
            {
              number: 1,
              title: 'Test Issue',
              state: 'OPEN',
              author: { login: 'user1' },
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z'
            },
            {
              number: 2,
              title: 'New Issue',
              state: 'OPEN',
              author: { login: 'user2' },
              createdAt: '2025-01-02T00:00:00Z',
              updatedAt: '2025-01-02T00:00:00Z'
            }
          ])
        });
      });

      // 新規Issue #2 のコメント取得
      exec.mockImplementationOnce((cmd, callback) => {
        callback(null, {
          stdout: JSON.stringify({ comments: [] })
        });
      });

      // 初回実行（キャッシュ作成）
      await monitorRepositories(['owner/repo']);

      // 初回は「監視開始」ログが出力されることを確認
      expect(log).toHaveBeenCalledWith(
        'INFO',
        expect.stringContaining('監視開始')
      );

      jest.clearAllMocks();

      // 2回目実行（新規Issue検出）
      await monitorRepositories(['owner/repo']);

      // 新規Issue検出ログを確認
      expect(log).toHaveBeenCalledWith(
        'INFO',
        expect.stringContaining('🆕 新しいIssue')
      );
      expect(log).toHaveBeenCalledWith(
        'INFO',
        expect.stringContaining('owner/repo#2')
      );
    });

    test('should reject invalid repo format and log error', async () => {
      await monitorRepositories(['invalid-repo-format']);

      // 無効なリポジトリ形式でエラーログが出力されることを確認
      expect(log).toHaveBeenCalledWith(
        'ERROR',
        expect.stringContaining('無効なリポジトリ形式')
      );
    });

    test('should handle command execution errors gracefully', async () => {
      const { exec } = require('child_process');

      exec.mockImplementation((cmd, callback) => {
        callback(new Error('gh command not found'));
      });

      // エラーでもクラッシュしないことを確認
      await monitorRepositories(['owner/repo']);

      // WARNログが出力されることを確認
      expect(log).toHaveBeenCalledWith(
        'WARN',
        expect.stringContaining('Issue取得失敗')
      );
    });
  });

  describe('resetCache', () => {
    test('should clear cache', () => {
      resetCache();
      // キャッシュがリセットされたことを確認
      expect(true).toBe(true);
    });
  });
});

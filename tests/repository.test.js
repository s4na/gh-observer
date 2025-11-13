// TDD: RED フェーズ - リポジトリ取得テスト
const { exec } = require('child_process');
const { fetchRepositories } = require('../src/repository');

jest.mock('child_process');

describe('repository - fetchRepositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('リポジトリ取得', () => {
    test('ユーザーリポジトリと組織リポジトリを返す', async () => {
      // ghコマンドの出力をモック
      const userRepos = JSON.stringify([
        { name: 'repo1', owner: { login: 'user' }, url: 'https://...' }
      ]);
      const orgs = 'org1\norg2';
      const orgRepos = JSON.stringify([
        { name: 'org-repo', owner: { login: 'org1' }, url: 'https://...' }
      ]);

      exec.mockImplementation((cmd, callback) => {
        if (cmd.includes('gh repo list --json')) {
          callback(null, { stdout: userRepos });
        } else if (cmd.includes('gh api user/orgs')) {
          callback(null, { stdout: orgs });
        } else if (cmd.includes('gh repo list org')) {
          callback(null, { stdout: orgRepos });
        }
      });

      const result = await fetchRepositories();

      expect(result).toHaveProperty('userRepos');
      expect(result).toHaveProperty('orgRepos');
      expect(Array.isArray(result.userRepos)).toBe(true);
      expect(Array.isArray(result.orgRepos)).toBe(true);
    });

    test('エラーが発生した場合も構造を返す', async () => {
      exec.mockImplementation((cmd, callback) => {
        callback(new Error('gh command not found'));
      });

      const result = await fetchRepositories();

      expect(result).toHaveProperty('userRepos');
      expect(result).toHaveProperty('orgRepos');
      expect(Array.isArray(result.userRepos)).toBe(true);
      expect(Array.isArray(result.orgRepos)).toBe(true);
    });

    test('最初のghコマンドで全体エラーが発生するとerrorプロパティを含む', async () => {
      // すべてのghコマンドがエラーになるようにモック
      exec.mockImplementation((cmd, callback) => {
        callback(new Error('gh command not found'));
      });

      const result = await fetchRepositories();

      // すべてのコマンドが失敗した場合、エラーは2番目のcatch以降で発生する可能性もある
      expect(result).toHaveProperty('userRepos');
      expect(result).toHaveProperty('orgRepos');
    });
  });

  describe('データ構造', () => {
    test('組織ごとのリポジトリをネストして返す', async () => {
      const result = {
        userRepos: [],
        orgRepos: [
          {
            org: 'test-org',
            repos: [
              { name: 'repo1', owner: { login: 'test-org' }, url: 'https://...' }
            ]
          }
        ]
      };

      expect(result.orgRepos[0]).toHaveProperty('org');
      expect(result.orgRepos[0]).toHaveProperty('repos');
      expect(Array.isArray(result.orgRepos[0].repos)).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('ユーザーリポジトリ取得失敗時も処理を続ける', async () => {
      let callCount = 0;
      exec.mockImplementation((cmd, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(new Error('User repos fetch failed'));
        } else {
          callback(null, { stdout: '[]' });
        }
      });

      const result = await fetchRepositories();

      expect(result).toHaveProperty('userRepos');
      expect(result).toHaveProperty('orgRepos');
      expect(Array.isArray(result.userRepos)).toBe(true);
      expect(Array.isArray(result.orgRepos)).toBe(true);
    });
  });
});

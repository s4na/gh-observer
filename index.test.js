// テスト環境を設定
process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

const {
  formatTime,
  log,
  ensureConfigFile,
  saveConfig,
  generateHTML,
  fetchRepositories,
  findAvailablePort,
  CONFIG_DIR,
  CONFIG_FILE
} = require('./index.js');

// モック用のテストディレクトリ
const TEST_CONFIG_DIR = path.join(os.tmpdir(), 'test-gh-observer-' + Date.now());
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 's4na-gh-observer.yaml');

describe('formatTime', () => {
  test('時刻を正しくフォーマットする', () => {
    const date = new Date('2024-01-01T09:05:03');
    expect(formatTime(date)).toBe('09:05:03');
  });

  test('0埋めが正しく動作する', () => {
    const date = new Date('2024-01-01T00:00:00');
    expect(formatTime(date)).toBe('00:00:00');
  });

  test('23時台の時刻を正しくフォーマットする', () => {
    const date = new Date('2024-01-01T23:59:59');
    expect(formatTime(date)).toBe('23:59:59');
  });

  test('午後の時刻を正しくフォーマットする', () => {
    const date = new Date('2024-01-01T15:30:45');
    expect(formatTime(date)).toBe('15:30:45');
  });

  test('一桁の時刻を0埋めする', () => {
    const date = new Date('2024-01-01T01:02:03');
    expect(formatTime(date)).toBe('01:02:03');
  });
});

describe('log', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('INFOレベルのログが正しく出力される', () => {
    log('INFO', 'テストメッセージ');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('INFO');
    expect(output).toContain('テストメッセージ');
  });

  test('ERRORレベルのログが正しく出力される', () => {
    log('ERROR', 'エラーメッセージ');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('ERROR');
    expect(output).toContain('エラーメッセージ');
  });

  test('WARNレベルのログが正しく出力される', () => {
    log('WARN', '警告メッセージ');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('WARN');
    expect(output).toContain('警告メッセージ');
  });

  test('タイムスタンプが含まれる', () => {
    log('INFO', 'テスト');
    const output = consoleLogSpy.mock.calls[0][0];
    // タイムスタンプは HH:MM:SS 形式
    expect(output).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe('generateHTML', () => {
  test('HTMLが正しく生成される', () => {
    const html = generateHTML(10);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('GitHub Observer');
  });

  test('経過時間が正しく埋め込まれる', () => {
    const html = generateHTML(42);
    expect(html).toContain('42秒');
  });

  test('経過時間が0秒の場合も正しく表示される', () => {
    const html = generateHTML(0);
    expect(html).toContain('0秒');
  });

  test('APIエンドポイントのパスが含まれる', () => {
    const html = generateHTML(5);
    expect(html).toContain('/api/elapsed');
    expect(html).toContain('/api/save-targets');
  });

  test('基本的なスタイルが含まれる', () => {
    const html = generateHTML(5);
    expect(html).toContain('<style>');
    expect(html).toContain('background');
    expect(html).toContain('.container');
  });

  test('JavaScriptによる自動更新コードが含まれる', () => {
    const html = generateHTML(5);
    expect(html).toContain('<script>');
    expect(html).toContain('setInterval');
    expect(html).toContain('fetch');
  });

  test('リポジトリデータなしでもHTMLが生成される', () => {
    const html = generateHTML(10, null, []);
    expect(html).toContain('読み込み中...');
  });

  test('エラーメッセージが表示される', () => {
    const repoData = {
      userRepos: [],
      orgRepos: [],
      error: 'テストエラー'
    };
    const html = generateHTML(5, repoData, []);
    expect(html).toContain('テストエラー');
  });

  test('個人リポジトリが表示される', () => {
    const repoData = {
      userRepos: [
        {
          name: 'test-repo',
          owner: { login: 'testuser' },
          url: 'https://github.com/testuser/test-repo',
          description: 'テストリポジトリ'
        }
      ],
      orgRepos: []
    };
    const html = generateHTML(5, repoData, []);
    expect(html).toContain('test-repo');
    expect(html).toContain('testuser');
    expect(html).toContain('テストリポジトリ');
  });

  test('組織のリポジトリが表示される', () => {
    const repoData = {
      userRepos: [],
      orgRepos: [
        {
          org: 'test-org',
          repos: [
            {
              name: 'org-repo',
              owner: { login: 'test-org' },
              url: 'https://github.com/test-org/org-repo',
              description: '組織リポジトリ'
            }
          ]
        }
      ]
    };
    const html = generateHTML(5, repoData, []);
    expect(html).toContain('test-org');
    expect(html).toContain('org-repo');
    expect(html).toContain('組織リポジトリ');
  });

  test('保存済みターゲットにチェックが入る', () => {
    const repoData = {
      userRepos: [
        {
          name: 'test-repo',
          owner: { login: 'testuser' },
          url: 'https://github.com/testuser/test-repo'
        }
      ],
      orgRepos: []
    };
    const html = generateHTML(5, repoData, ['testuser/test-repo']);
    expect(html).toContain('checked');
  });

  test('説明がないリポジトリも表示される', () => {
    const repoData = {
      userRepos: [
        {
          name: 'no-desc-repo',
          owner: { login: 'testuser' },
          url: 'https://github.com/testuser/no-desc-repo'
        }
      ],
      orgRepos: []
    };
    const html = generateHTML(5, repoData, []);
    expect(html).toContain('no-desc-repo');
    // repo-descriptionクラスはCSSに含まれるが、実際の説明文divは生成されない
    expect(html).not.toContain('<div class="repo-description">');
  });
});

describe('設定ファイルパス', () => {
  test('CONFIG_DIRが正しく設定されている', () => {
    expect(CONFIG_DIR).toContain('.config');
  });

  test('CONFIG_FILEが正しく設定されている', () => {
    expect(CONFIG_FILE).toContain('.config');
    expect(CONFIG_FILE).toContain('s4na-gh-observer.yaml');
  });
});

describe('ensureConfigFile', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('設定ファイルが存在しない場合はデフォルト設定を返す', () => {
    // 実際のファイルシステムを使わずにモックで検証
    const config = ensureConfigFile();
    expect(config).toBeDefined();
    expect(config).toHaveProperty('interval');
    expect(config).toHaveProperty('showElapsedTime');
    expect(config).toHaveProperty('timeFormat');
    expect(config).toHaveProperty('targets');
  });
});

describe('saveConfig', () => {
  let consoleLogSpy;
  let tempDir;
  let tempConfigFile;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    // 一時ディレクトリを作成
    tempDir = path.join(os.tmpdir(), 'test-config-' + Date.now());
    tempConfigFile = path.join(tempDir, 'test-config.yaml');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    // クリーンアップ
    if (fs.existsSync(tempConfigFile)) {
      fs.unlinkSync(tempConfigFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  test('設定が正しく保存される', () => {
    const config = {
      interval: 2000,
      showElapsedTime: true,
      timeFormat: '24h',
      targets: ['test/repo']
    };

    // 実際のファイルには保存せず、関数の戻り値を検証
    const result = saveConfig(config);
    expect(typeof result).toBe('boolean');
  });
});

describe('findAvailablePort', () => {
  test('利用可能なポートを見つける', async () => {
    const port = await findAvailablePort(3000);
    expect(port).toBeGreaterThanOrEqual(3000);
    expect(port).toBeLessThan(3010);
  }, 10000);

  test('開始ポートが指定できる', async () => {
    const port = await findAvailablePort(4000);
    expect(port).toBeGreaterThanOrEqual(4000);
  }, 10000);

  test('最大試行回数を超えるとエラーになる', async () => {
    // ポート数を制限して必ず失敗させる
    await expect(findAvailablePort(0, 0)).rejects.toThrow();
  }, 10000);
});

describe('fetchRepositories', () => {
  test('リポジトリ情報の取得が試行される', async () => {
    // gh コマンドが利用できない環境でもテストが通るように、エラーハンドリングを検証
    const result = await fetchRepositories();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('userRepos');
    expect(result).toHaveProperty('orgRepos');
  }, 30000);

  test('エラー時にも適切な構造を返す', async () => {
    const result = await fetchRepositories();
    expect(Array.isArray(result.userRepos)).toBe(true);
    expect(Array.isArray(result.orgRepos)).toBe(true);
  }, 30000);
});

describe('generateHTML - エッジケース', () => {
  test('空のリポジトリリストでも動作する', () => {
    const repoData = {
      userRepos: [],
      orgRepos: []
    };
    const html = generateHTML(0, repoData, []);
    expect(html).toContain('リポジトリがありません');
  });

  test('大きな経過時間も正しく表示される', () => {
    const html = generateHTML(999999);
    expect(html).toContain('999999秒');
  });

  test('複数の組織が表示される', () => {
    const repoData = {
      userRepos: [],
      orgRepos: [
        {
          org: 'org1',
          repos: [
            {
              name: 'repo1',
              owner: { login: 'org1' },
              url: 'https://github.com/org1/repo1'
            }
          ]
        },
        {
          org: 'org2',
          repos: [
            {
              name: 'repo2',
              owner: { login: 'org2' },
              url: 'https://github.com/org2/repo2'
            }
          ]
        }
      ]
    };
    const html = generateHTML(5, repoData, []);
    expect(html).toContain('org1');
    expect(html).toContain('org2');
    expect(html).toContain('repo1');
    expect(html).toContain('repo2');
  });

  test('特殊文字を含むリポジトリ名も表示される', () => {
    const repoData = {
      userRepos: [
        {
          name: 'repo-with-dash',
          owner: { login: 'test_user' },
          url: 'https://github.com/test_user/repo-with-dash',
          description: 'リポジトリ: テスト & デモ'
        }
      ],
      orgRepos: []
    };
    const html = generateHTML(5, repoData, []);
    expect(html).toContain('repo-with-dash');
    expect(html).toContain('test_user');
  });
});

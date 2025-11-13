// TDD: RED フェーズ - テストを先に書く
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ensureConfigFile, saveConfig } = require('../src/config');

describe('config - ensureConfigFile', () => {
  let testConfigDir;
  let originalConfigDir;
  let consoleLogSpy;

  beforeEach(() => {
    // テスト用の一時設定ディレクトリを作成
    testConfigDir = path.join(os.tmpdir(), `test-config-${Date.now()}`);
    originalConfigDir = process.env.CONFIG_DIR;
    process.env.CONFIG_DIR = testConfigDir;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.CONFIG_DIR = originalConfigDir;

    // クリーンアップ: テストディレクトリを削除
    if (fs.existsSync(testConfigDir)) {
      const configFile = path.join(testConfigDir, 's4na-gh-observer.yaml');
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile);
      }
      fs.rmdirSync(testConfigDir);
    }
  });

  describe('デフォルト設定', () => {
    test('設定ファイルが存在しない場合、デフォルト設定を返す', () => {
      // configDirが存在しないため、新規作成される
      const config = ensureConfigFile(testConfigDir);

      expect(config).toBeDefined();
      expect(config).toHaveProperty('interval', 1000);
      expect(config).toHaveProperty('showElapsedTime', true);
      expect(config).toHaveProperty('timeFormat', '24h');
      expect(config).toHaveProperty('targets', expect.any(Array));
    });

    test('デフォルト設定はタイムスタンプを含む', () => {
      const config = ensureConfigFile(testConfigDir);

      expect(config).toHaveProperty('createdAt');
      expect(typeof config.createdAt).toBe('string');
      // ISO 8601形式であることを確認
      expect(config.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('設定ファイルの作成', () => {
    test('設定ディレクトリが存在しない場合、作成される', () => {
      ensureConfigFile(testConfigDir);

      expect(fs.existsSync(testConfigDir)).toBe(true);
    });

    test('設定ファイルが存在しない場合、YAML形式で作成される', () => {
      ensureConfigFile(testConfigDir);

      const configFile = path.join(testConfigDir, 's4na-gh-observer.yaml');
      expect(fs.existsSync(configFile)).toBe(true);

      // ファイル内容がYAML形式であることを確認
      const content = fs.readFileSync(configFile, 'utf8');
      expect(content).toContain('interval');
      expect(content).toContain('showElapsedTime');
    });

    test('既存の設定ファイルを読み込む', () => {
      // 最初の呼び出しで設定ファイルを作成
      const config1 = ensureConfigFile(testConfigDir);
      const createdAt1 = config1.createdAt;

      // 2番目の呼び出しで既存ファイルを読み込む
      const config2 = ensureConfigFile(testConfigDir);

      // createdAtが同じであることを確認（新規作成されていない）
      expect(config2.createdAt).toBe(createdAt1);
    });
  });
});

describe('config - saveConfig', () => {
  let testConfigDir;
  let originalConfigDir;
  let consoleLogSpy;

  beforeEach(() => {
    testConfigDir = path.join(os.tmpdir(), `test-config-${Date.now()}`);
    originalConfigDir = process.env.CONFIG_DIR;
    process.env.CONFIG_DIR = testConfigDir;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.CONFIG_DIR = originalConfigDir;

    if (fs.existsSync(testConfigDir)) {
      const configFile = path.join(testConfigDir, 's4na-gh-observer.yaml');
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile);
      }
      fs.rmdirSync(testConfigDir);
    }
  });

  describe('設定の保存', () => {
    test('設定をYAML形式で保存する', () => {
      const config = {
        interval: 2000,
        showElapsedTime: false,
        timeFormat: '12h',
        targets: ['owner/repo1', 'owner/repo2']
      };

      saveConfig(config, testConfigDir);

      const configFile = path.join(testConfigDir, 's4na-gh-observer.yaml');
      expect(fs.existsSync(configFile)).toBe(true);

      const content = fs.readFileSync(configFile, 'utf8');
      expect(content).toContain('interval: 2000');
      expect(content).toContain('showElapsedTime: false');
      expect(content).toContain('timeFormat: 12h');
    });

    test('成功時はtrueを返す', () => {
      const config = {
        interval: 1000,
        showElapsedTime: true,
        timeFormat: '24h',
        targets: []
      };

      const result = saveConfig(config, testConfigDir);

      expect(result).toBe(true);
    });

    test('ディレクトリが存在しない場合、作成される', () => {
      const config = {
        interval: 1000,
        showElapsedTime: true,
        timeFormat: '24h',
        targets: []
      };

      saveConfig(config, testConfigDir);

      expect(fs.existsSync(testConfigDir)).toBe(true);
    });

    test('既存の設定ファイルを上書きする', () => {
      // 最初の設定を保存
      const config1 = {
        interval: 1000,
        targets: ['repo1']
      };
      saveConfig(config1, testConfigDir);

      // 2番目の設定で上書き
      const config2 = {
        interval: 3000,
        targets: ['repo1', 'repo2', 'repo3']
      };
      saveConfig(config2, testConfigDir);

      const configFile = path.join(testConfigDir, 's4na-gh-observer.yaml');
      const content = fs.readFileSync(configFile, 'utf8');
      expect(content).toContain('interval: 3000');
      expect(content).toContain('- repo3');
    });

    test('空の設定でも保存できる', () => {
      const config = {};

      const result = saveConfig(config, testConfigDir);

      expect(result).toBe(true);
      const configFile = path.join(testConfigDir, 's4na-gh-observer.yaml');
      expect(fs.existsSync(configFile)).toBe(true);
    });
  });
});

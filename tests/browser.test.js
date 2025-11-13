// TDD: RED フェーズ - ブラウザ操作テスト
const { exec } = require('child_process');
const { openBrowser } = require('../src/browser');

jest.mock('child_process');

describe('browser - openBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('プラットフォーム別', () => {
    test('macOS（darwin）でopenコマンドを実行', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      openBrowser('http://localhost:3000');

      expect(exec).toHaveBeenCalledWith('open http://localhost:3000', expect.any(Function));

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('Windows（win32）でstartコマンドを実行', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      openBrowser('http://localhost:3000');

      expect(exec).toHaveBeenCalledWith('start http://localhost:3000', expect.any(Function));

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('Linux（その他）でxdg-openコマンドを実行', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      openBrowser('http://localhost:3000');

      expect(exec).toHaveBeenCalledWith('xdg-open http://localhost:3000', expect.any(Function));

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('URL処理', () => {
    test('URLをそのままコマンドに渡す', () => {
      openBrowser('http://localhost:5000');

      const callArgs = exec.mock.calls[0][0];
      expect(callArgs).toContain('http://localhost:5000');
    });

    test('複数回呼び出せる', () => {
      openBrowser('http://localhost:3000');
      openBrowser('http://localhost:4000');

      expect(exec).toHaveBeenCalledTimes(2);
    });
  });

  describe('エラーハンドリング', () => {
    test('エラーが発生してもthrowしない', () => {
      const errorCallback = jest.fn((error) => {
        // エラーコールバックが呼ばれることを確認
      });

      jest.spyOn(console, 'log').mockImplementation();

      openBrowser('http://localhost:3000');

      // エラーコールバックをシミュレート
      const callback = exec.mock.calls[0][1];
      expect(() => {
        callback(new Error('ブラウザを開けませんでした'));
      }).not.toThrow();
    });
  });
});

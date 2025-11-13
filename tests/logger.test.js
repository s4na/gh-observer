// TDD: RED フェーズ - テストを先に書く
const { formatTime, log } = require('../src/logger');

describe('logger - formatTime', () => {
  describe('時刻フォーマット', () => {
    test('HH:MM:SS形式で時刻をフォーマットする', () => {
      const date = new Date('2024-01-01T09:05:03');
      expect(formatTime(date)).toBe('09:05:03');
    });

    test('時間を0埋めする', () => {
      const date = new Date('2024-01-01T01:00:00');
      expect(formatTime(date)).toBe('01:00:00');
    });

    test('分を0埋めする', () => {
      const date = new Date('2024-01-01T10:05:00');
      expect(formatTime(date)).toBe('10:05:00');
    });

    test('秒を0埋めする', () => {
      const date = new Date('2024-01-01T10:10:03');
      expect(formatTime(date)).toBe('10:10:03');
    });

    test('24時間形式で動作する', () => {
      const date = new Date('2024-01-01T23:59:59');
      expect(formatTime(date)).toBe('23:59:59');
    });

    test('0時を正しく表示する', () => {
      const date = new Date('2024-01-01T00:00:00');
      expect(formatTime(date)).toBe('00:00:00');
    });
  });
});

describe('logger - log', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('ログレベル', () => {
    test('INFOレベルのログを出力する', () => {
      log('INFO', 'テストメッセージ');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('INFO');
      expect(output).toContain('テストメッセージ');
    });

    test('ERRORレベルのログを出力する', () => {
      log('ERROR', 'エラーメッセージ');

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('ERROR');
      expect(output).toContain('エラーメッセージ');
    });

    test('WARNレベルのログを出力する', () => {
      log('WARN', '警告メッセージ');

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('WARN');
      expect(output).toContain('警告メッセージ');
    });
  });

  describe('タイムスタンプ', () => {
    test('タイムスタンプをHH:MM:SS形式で含む', () => {
      log('INFO', 'テスト');

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    test('ログレベルとメッセージの間にタイムスタンプを挿入', () => {
      log('INFO', 'テスト');

      const output = consoleLogSpy.mock.calls[0][0];
      const parts = output.split(' ');
      expect(parts[0]).toBe('INFO');
      expect(parts[1]).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(parts[2]).toBe('テスト');
    });
  });

  describe('メッセージ形式', () => {
    test('複数単語のメッセージを正しく出力', () => {
      log('INFO', '複数のメッセージを出力する');

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('複数のメッセージを出力する');
    });

    test('特殊文字を含むメッセージを正しく出力', () => {
      log('INFO', 'パス: /path/to/file');

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('パス: /path/to/file');
    });
  });
});

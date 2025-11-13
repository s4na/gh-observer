// テスト環境を設定
process.env.NODE_ENV = 'test';

const {
  formatTime,
  generateHTML,
  CONFIG_DIR,
  CONFIG_FILE
} = require('./index.js');

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

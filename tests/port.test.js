// TDD: RED フェーズ - ポート管理テスト
const { findAvailablePort } = require('../src/port');

describe('port - findAvailablePort', () => {
  describe('ポート検索', () => {
    test('利用可能なポートを見つけて返す', async () => {
      const port = await findAvailablePort(3000);

      expect(typeof port).toBe('number');
      expect(port).toBeGreaterThanOrEqual(3000);
      expect(port).toBeLessThan(3010);
    });

    test('指定したポートから検索を開始する', async () => {
      const port = await findAvailablePort(4000);

      expect(port).toBeGreaterThanOrEqual(4000);
    });

    test('最大試行回数を超えるとエラーをthrowする', async () => {
      // maxAttemptsを0にして検索に失敗させる
      await expect(findAvailablePort(1, 0)).rejects.toThrow();
    });

    test('異なる開始ポートで異なるポートが返されることがある', async () => {
      const port1 = await findAvailablePort(5000);
      const port2 = await findAvailablePort(6000);

      expect(port1).toBeGreaterThanOrEqual(5000);
      expect(port2).toBeGreaterThanOrEqual(6000);
    });
  });

  describe('エラーハンドリング', () => {
    test('エラーメッセージに開始ポートと終了ポートが含まれる', async () => {
      try {
        await findAvailablePort(1, 0);
        fail('エラーがthrowされるべき');
      } catch (error) {
        expect(error.message).toContain('利用可能なポート');
      }
    });
  });
});

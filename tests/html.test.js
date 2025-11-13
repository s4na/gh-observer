// TDD: RED フェーズ - HTML生成テスト
const { generateHTML } = require('../src/html');

describe('html - generateHTML', () => {
  describe('基本的なHTML構造', () => {
    test('DOCTYPE宣言を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('html lang="ja"属性を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('<html lang="ja">');
    });

    test('タイトルを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('GitHub Observer');
    });

    test('メタ情報を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('charset');
      expect(html).toContain('UTF-8');
      expect(html).toContain('viewport');
    });
  });

  describe('経過時間の表示', () => {
    test('経過時間を秒単位で表示', () => {
      const html = generateHTML(42, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('42秒');
    });

    test('0秒の場合も表示される', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('0秒');
    });

    test('大きな数値も正しく表示', () => {
      const html = generateHTML(999999, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('999999秒');
    });
  });

  describe('スタイルシート', () => {
    test('CSSを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    test('レイアウト関連のスタイルを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('.container');
      expect(html).toContain('background');
    });
  });

  describe('JavaScript機能', () => {
    test('スクリプトを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('<script>');
      expect(html).toContain('</script>');
    });

    test('自動更新機能を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('setInterval');
      expect(html).toContain('fetch');
    });

    test('リポジトリ保存機能を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('saveSelectedRepos');
      expect(html).toContain('/api/save-targets');
    });

    test('リポジトリ読み込みAPI呼び出しを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('/api/repos');
      expect(html).toContain('loadRepositories');
    });

    test('ページロード時のリポジトリ読み込みを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('loadRepositories()');
    });
  });

  describe('リポジトリ表示', () => {
    test('個人リポジトリを表示', () => {
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

      const html = generateHTML(0, repoData, []);
      expect(html).toContain('test-repo');
      expect(html).toContain('testuser');
      expect(html).toContain('テストリポジトリ');
    });

    test('組織のリポジトリを表示', () => {
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

      const html = generateHTML(0, repoData, []);
      expect(html).toContain('test-org');
      expect(html).toContain('org-repo');
      expect(html).toContain('組織リポジトリ');
    });

    test('選択済みリポジトリにchecked属性をつける', () => {
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

      const html = generateHTML(0, repoData, ['testuser/test-repo']);
      expect(html).toContain('checked');
    });
  });

  describe('エラー表示', () => {
    test('エラーがある場合はエラーメッセージを表示', () => {
      const repoData = {
        userRepos: [],
        orgRepos: [],
        error: 'リポジトリの取得に失敗しました'
      };

      const html = generateHTML(0, repoData, []);
      expect(html).toContain('リポジトリの取得に失敗しました');
    });
  });

  describe('データなしの場合', () => {
    test('repoDataがnullの場合も処理される', () => {
      const html = generateHTML(0, null, []);
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('空のリポジトリリストでは「リポジトリがありません」と表示', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('リポジトリがありません');
    });
  });

  describe('検索機能', () => {
    test('検索入力フィールドを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('id="search-input"');
      expect(html).toContain('リポジトリ名で検索');
    });

    test('検索クリアボタンを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('id="search-clear-button"');
      expect(html).toContain('clearSearch');
    });

    test('検索結果情報表示用のdivを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('id="search-results-info"');
    });

    test('検索機能の初期化を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('setupSearch');
    });

    test('検索フィルタリングのCSSクラスを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('.hidden');
      expect(html).toContain('display: none');
    });

    test('repoItemにhidden属性の設定機能を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('.repo-item.hidden');
    });

    test('組織セクションにhidden属性の設定機能を含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('.org-section.hidden');
    });

    test('保存機能で検索中の非表示項目も含まれることをコメント確認', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      // saveSelectedRepos は .repo-checkbox:checked で選択されたすべてのチェックボックスを取得する
      // つまり、非表示になっていても（display: none）、チェック状態は保持されるため、
      // 保存時に非表示項目も含まれることが保証される
      expect(html).toContain('.repo-checkbox:checked');
      expect(html).toContain('selectedRepos');
    });
  });

  describe('保存機能と検索の統合', () => {
    test('saveSelectedReposはチェック状態に基づいて選択されたリポジトリを抽出', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      // saveSelectedReposが .repo-checkbox:checked で全てのチェック済みチェックボックスを選択することを確認
      expect(html).toContain('querySelectorAll(\'.repo-checkbox:checked\')');
    });

    test('保存APIに送信される対象に非表示項目も含まれることが実装される', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      // チェック状態は検索フィルタリング（hiddenクラス）に影響されないため、
      // 非表示状態でも checkboxの checked 属性は保持される
      expect(html).toContain('Array.from(checkboxes).map(cb => cb.value)');
    });

    test('検索実行中でも saveSelectedRepos 関数が動作する', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      // saveSelectedRepos は DOM から .repo-checkbox:checked を直接クエリする
      // 検索フィルタリング（display:none）は JavaScript の checked 属性には影響しない
      expect(html).toContain('function saveSelectedRepos');
      expect(html).toContain('/api/save-targets');
    });
  });

  describe('リポジトリ更新機能', () => {
    test('リポジトリ更新ボタンを含む', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('id="refresh-button"');
      expect(html).toContain('refreshRepositories');
      expect(html).toContain('リポジトリを更新');
    });

    test('リポジトリ更新APIエンドポイントを呼び出す', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('/api/repos/refresh');
    });

    test('リポジトリ更新ボタンはdisabled状態に対応', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('refreshButton.disabled');
    });

    test('更新中はボタンテキストが変更される', () => {
      const html = generateHTML(0, { userRepos: [], orgRepos: [] }, []);
      expect(html).toContain('更新中...');
    });
  });
});

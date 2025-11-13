// HTML生成モジュール
// Webページのコンテンツを生成する機能を担当

/**
 * 経過時間とリポジトリ情報を含むHTMLを生成
 * @param {number} elapsed - 経過時間（秒）
 * @param {object} repoData - リポジトリデータ { userRepos, orgRepos, error? }
 * @param {Array<string>} savedTargets - 保存済みターゲットリスト
 * @returns {string} 生成されたHTML
 */
function generateHTML(elapsed, repoData, savedTargets) {
  const renderRepoList = (repos) => {
    if (!repos || repos.length === 0) {
      return '<p class="no-repos">リポジトリがありません</p>';
    }
    return repos.map(repo => {
      const repoFullName = `${repo.owner.login}/${repo.name}`;
      const isChecked = savedTargets.includes(repoFullName) ? 'checked' : '';
      return `
      <div class="repo-item">
        <label class="repo-checkbox-label">
          <input type="checkbox" class="repo-checkbox" value="${repoFullName}" ${isChecked}>
          <div class="repo-info">
            <div class="repo-name">
              <a href="${repo.url}" target="_blank">${repoFullName}</a>
            </div>
            ${repo.description ? `<div class="repo-description">${repo.description}</div>` : ''}
          </div>
        </label>
      </div>
    `;
    }).join('');
  };

  const renderOrgRepos = (orgRepos) => {
    if (!orgRepos || orgRepos.length === 0) {
      return '<p class="no-repos">所属している組織がありません</p>';
    }
    return orgRepos.map(({ org, repos }) => `
      <div class="org-section">
        <h3 class="org-name">${org}</h3>
        ${renderRepoList(repos)}
      </div>
    `).join('');
  };

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Observer</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
      font-size: 2.5rem;
      text-align: center;
    }
    .elapsed-time {
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
      text-align: center;
      margin-bottom: 2rem;
      font-variant-numeric: tabular-nums;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }
    .org-section {
      margin-bottom: 2rem;
    }
    .org-name {
      color: #555;
      font-size: 1.4rem;
      margin-bottom: 0.8rem;
      padding-left: 1rem;
      border-left: 4px solid #764ba2;
    }
    .repo-item {
      padding: 1rem;
      margin-bottom: 0.8rem;
      background: #f8f9fa;
      border-radius: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .repo-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .repo-checkbox-label {
      display: flex;
      align-items: start;
      cursor: pointer;
      width: 100%;
    }
    .repo-checkbox {
      margin-right: 0.8rem;
      margin-top: 0.3rem;
      width: 18px;
      height: 18px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .repo-info {
      flex: 1;
    }
    .repo-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
    }
    .repo-name a {
      color: #667eea;
      text-decoration: none;
    }
    .repo-name a:hover {
      text-decoration: underline;
    }
    .repo-description {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .save-button {
      display: block;
      margin: 2rem auto;
      padding: 1rem 2rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
    }
    .save-button:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }
    .save-button:active {
      transform: translateY(0);
    }
    .message {
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
      text-align: center;
      font-weight: 500;
    }
    .message.success {
      background: #d4edda;
      color: #155724;
    }
    .message.error {
      background: #f8d7da;
      color: #721c24;
    }
    .no-repos {
      color: #999;
      font-style: italic;
      padding: 1rem;
      text-align: center;
    }
    .error-message {
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .info {
      margin-top: 2rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #666;
      text-align: center;
    }
    .search-container {
      margin-bottom: 2rem;
      display: flex;
      gap: 0.5rem;
    }
    .search-input {
      flex: 1;
      padding: 0.8rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .search-clear-button {
      padding: 0.8rem 1.2rem;
      background: #999;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.3s;
    }
    .search-clear-button:hover {
      background: #777;
    }
    .repo-item.hidden {
      display: none;
    }
    .org-section.hidden {
      display: none;
    }
    .search-results-info {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 GitHub Observer</h1>
    <div class="elapsed-time" id="elapsed">経過時間: ${elapsed}秒</div>

    ${repoData && repoData.error ? `<div class="error-message">エラー: ${repoData.error}</div>` : ''}

    <div id="message-container"></div>

    <div class="search-container">
      <input type="text" class="search-input" id="search-input" placeholder="リポジトリ名で検索...">
      <button class="search-clear-button" id="search-clear-button" onclick="clearSearch()" style="display: none;">クリア</button>
    </div>

    <div class="search-results-info" id="search-results-info"></div>

    <button class="save-button" onclick="saveSelectedRepos()">選択したリポジトリを保存</button>

    <div class="section">
      <h2 class="section-title">🔑 個人リポジトリ</h2>
      <div id="user-repos">
        ${repoData ? renderRepoList(repoData.userRepos) : '<p class="no-repos">読み込み中...</p>'}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">🏢 組織のリポジトリ</h2>
      <div id="org-repos">
        ${repoData ? renderOrgRepos(repoData.orgRepos) : '<p class="no-repos">読み込み中...</p>'}
      </div>
    </div>

    <div class="info">
      このページは自動的に更新されます<br>
      停止するには、ターミナルで Ctrl+C を押してください
    </div>
  </div>
  <script>
    // メッセージを表示する関数
    function showMessage(message, isSuccess) {
      const container = document.getElementById('message-container');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
      messageDiv.textContent = message;
      container.innerHTML = '';
      container.appendChild(messageDiv);

      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }

    // リポジトリリストをHTMLで生成
    function renderRepoList(repos, savedTargets) {
      if (!repos || repos.length === 0) {
        return '<p class="no-repos">リポジトリがありません</p>';
      }
      return repos.map(repo => {
        const repoFullName = repo.owner.login + '/' + repo.name;
        const isChecked = savedTargets.includes(repoFullName) ? 'checked' : '';
        return '<div class="repo-item"><label class="repo-checkbox-label"><input type="checkbox" class="repo-checkbox" value="' + repoFullName + '" ' + isChecked + '><div class="repo-info"><div class="repo-name"><a href="' + repo.url + '" target="_blank">' + repoFullName + '</a></div>' + (repo.description ? '<div class="repo-description">' + repo.description + '</div>' : '') + '</div></label></div>';
      }).join('');
    }

    // 組織のリポジトリをHTMLで生成
    function renderOrgRepos(orgRepos, savedTargets) {
      if (!orgRepos || orgRepos.length === 0) {
        return '<p class="no-repos">所属している組織がありません</p>';
      }
      return orgRepos.map(function(item) {
        var org = item.org;
        var repos = item.repos;
        return '<div class="org-section"><h3 class="org-name">' + org + '</h3>' + renderRepoList(repos, savedTargets) + '</div>';
      }).join('');
    }

    // ページロード時にリポジトリ情報を取得・更新
    function loadRepositories() {
      fetch('/api/repos')
        .then(res => res.json())
        .then(data => {
          const repoData = data.repoData;
          const savedTargets = data.savedTargets || [];

          // 個人リポジトリを更新
          const userReposDiv = document.getElementById('user-repos');
          if (repoData && repoData.userRepos) {
            userReposDiv.innerHTML = renderRepoList(repoData.userRepos, savedTargets);
          }

          // 組織のリポジトリを更新
          const orgReposDiv = document.getElementById('org-repos');
          if (repoData && repoData.orgRepos) {
            orgReposDiv.innerHTML = renderOrgRepos(repoData.orgRepos, savedTargets);
          }
        })
        .catch(err => console.error('リポジトリの読み込みエラー:', err));
    }

    // ページロード時にリポジトリ情報を取得
    loadRepositories();

    // 検索機能の初期化
    setupSearch();

    // 検索機能
    function setupSearch() {
      const searchInput = document.getElementById('search-input');
      const searchClearButton = document.getElementById('search-clear-button');
      const searchResultsInfo = document.getElementById('search-results-info');

      searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        const repoItems = document.querySelectorAll('.repo-item');
        const orgSections = document.querySelectorAll('.org-section');

        let visibleCount = 0;
        let totalCount = repoItems.length;

        if (query === '') {
          // 検索をクリア
          repoItems.forEach(item => item.classList.remove('hidden'));
          orgSections.forEach(section => section.classList.remove('hidden'));
          searchClearButton.style.display = 'none';
          searchResultsInfo.textContent = '';
        } else {
          // 検索実行
          repoItems.forEach(item => {
            const repoName = item.textContent.toLowerCase();
            if (repoName.includes(query)) {
              item.classList.remove('hidden');
              visibleCount++;
            } else {
              item.classList.add('hidden');
            }
          });

          // 組織セクションの表示/非表示を判定
          orgSections.forEach(section => {
            const visibleRepos = section.querySelectorAll('.repo-item:not(.hidden)').length;
            if (visibleRepos === 0) {
              section.classList.add('hidden');
            } else {
              section.classList.remove('hidden');
            }
          });

          searchClearButton.style.display = 'inline-block';
          searchResultsInfo.textContent = '検索結果: ' + visibleCount + '/' + totalCount + 'リポジトリ';
        }
      });

      searchClearButton.addEventListener('click', clearSearch);
    }

    function clearSearch() {
      const searchInput = document.getElementById('search-input');
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    }

    // 選択されたリポジトリを保存する関数
    function saveSelectedRepos() {
      const checkboxes = document.querySelectorAll('.repo-checkbox:checked');
      const selectedRepos = Array.from(checkboxes).map(cb => cb.value);

      fetch('/api/save-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targets: selectedRepos })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showMessage('選択したリポジトリを保存しました (' + selectedRepos.length + '件)', true);
          // 保存後、リポジトリ情報を再読み込み
          loadRepositories();
        } else {
          showMessage('保存に失敗しました: ' + (data.error || '不明なエラー'), false);
        }
      })
      .catch(err => {
        showMessage('保存に失敗しました: ' + err.message, false);
      });
    }

    // 1秒ごとに経過時間を更新
    setInterval(() => {
      fetch('/api/elapsed')
        .then(res => res.json())
        .then(data => {
          document.getElementById('elapsed').textContent = '経過時間: ' + data.elapsed + '秒';
        })
        .catch(err => console.error('更新エラー:', err));
    }, 1000);
  </script>
</body>
</html>
  `;
}

module.exports = {
  generateHTML
};

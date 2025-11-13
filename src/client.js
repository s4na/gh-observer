// クライアント側のJavaScript
// このコードはブラウザで実行される

/* eslint-env browser */

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
    return `
      <div class="repo-item">
        <label class="repo-checkbox-label">
          <input type="checkbox" class="repo-checkbox" value="${repoFullName}" ${isChecked}>
          <div class="repo-info">
            <div class="repo-name">
              <a href="${repo.url}" target="_blank">${repoFullName}</a>
            </div>
            ${repo.description ? '<div class="repo-description">' + repo.description + '</div>' : ''}
          </div>
        </label>
      </div>
    `;
  }).join('');
}

// 組織のリポジトリをHTMLで生成
function renderOrgRepos(orgRepos, savedTargets) {
  if (!orgRepos || orgRepos.length === 0) {
    return '<p class="no-repos">所属している組織がありません</p>';
  }
  return orgRepos.map(({ org, repos }) => `
      <div class="org-section">
        <h3 class="org-name">${org}</h3>
        ${renderRepoList(repos, savedTargets)}
      </div>
    `).join('');
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

// 検索機能の初期化
setupSearch();

// リポジトリ情報を更新する関数
function refreshRepositories() {
  const refreshButton = document.getElementById('refresh-button');
  refreshButton.disabled = true;
  refreshButton.textContent = '🔄 更新中...';

  fetch('/api/repos/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showMessage('リポジトリ情報を更新しました', true);
        // リポジトリ情報を再読み込み
        loadRepositories();
      } else {
        showMessage('更新に失敗しました: ' + (data.error || '不明なエラー'), false);
      }
    })
    .catch(err => {
      showMessage('更新に失敗しました: ' + err.message, false);
    })
    .finally(() => {
      refreshButton.disabled = false;
      refreshButton.textContent = '🔄 リポジトリを更新';
    });
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

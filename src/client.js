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

// Issue監視モジュール
// GitHub リポジトリの Issue と Comment を監視し、変更を検出・ログ出力

const { exec } = require('child_process');
const { promisify } = require('util');
const { log } = require('./logger');

const execAsync = promisify(exec);

// キャッシュ: 前回取得したissueデータ
// { repoOwner/repoName: { issues: [], comments: {} } }
let issueCache = {};

/**
 * リポジトリ名の形式を検証（owner/name 形式のみ許可）
 * @param {string} repo - リポジトリ名
 * @returns {boolean} 有効な形式なら true
 */
function isValidRepoFormat(repo) {
  // owner/name 形式で、各部は英数字、ハイフン、アンダースコア、ドットのみ
  const repoRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  return repoRegex.test(repo);
}

/**
 * 指定のリポジトリから全Issueを取得
 * @param {string} repo - リポジトリ名 (owner/name 形式)
 * @returns {Promise<Array>} Issue配列
 */
async function fetchIssues(repo) {
  // リポジトリ名の形式検証
  if (!isValidRepoFormat(repo)) {
    log('ERROR', `無効なリポジトリ形式: ${repo}`);
    return [];
  }

  try {
    const cmd = `gh issue list --repo ${repo} --json number,title,state,createdAt,updatedAt,author --limit 100`;
    if (global.debugMode) {
      log('DEBUG', `📋 実行: ${cmd}`);
    }
    const { stdout } = await execAsync(cmd);
    return JSON.parse(stdout);
  } catch (err) {
    log('WARN', `Issue取得失敗 (${repo}): ${err.message}`);
    return [];
  }
}

/**
 * 指定のIssueのコメント一覧を取得
 * @param {string} repo - リポジトリ名 (owner/name 形式)
 * @param {number} issueNumber - Issue番号
 * @returns {Promise<Array>} Comment配列
 */
async function fetchIssueComments(repo, issueNumber) {
  // リポジトリ名の形式検証
  if (!isValidRepoFormat(repo)) {
    log('ERROR', `無効なリポジトリ形式: ${repo}`);
    return [];
  }

  try {
    const cmd = `gh issue view ${issueNumber} --repo ${repo} --json comments`;
    if (global.debugMode) {
      log('DEBUG', `📋 実行: ${cmd}`);
    }
    const { stdout } = await execAsync(cmd);
    const result = JSON.parse(stdout);
    return result.comments || [];
  } catch (err) {
    log('WARN', `Comment取得失敗 (${repo}#${issueNumber}): ${err.message}`);
    return [];
  }
}

/**
 * 指定のリポジトリのIssueをすべて監視し、変更があればログ出力
 * @param {string} repo - リポジトリ名 (owner/name 形式)
 */
async function monitorRepository(repo) {
  try {
    const currentIssues = await fetchIssues(repo);

    if (!issueCache[repo]) {
      // 初回実行時：全issueのコメントキャッシュを初期化
      issueCache[repo] = {
        issues: currentIssues,
        comments: {}
      };

      // 初回実行時に全issueのコメントをキャッシュに登録
      for (const issue of currentIssues) {
        const comments = await fetchIssueComments(repo, issue.number);
        issueCache[repo].comments[issue.number] = comments;
      }

      log('INFO', `監視開始: ${repo} (Issue: ${currentIssues.length}件)`);
      return; // 初回はキャッシュするだけ
    }

    const previousIssues = issueCache[repo].issues;

    // 新しいissueを検出
    const newIssues = currentIssues.filter(
      current => !previousIssues.find(prev => prev.number === current.number)
    );

    for (const issue of newIssues) {
      log('INFO', `🆕 新しいIssue: ${repo}#${issue.number} "${issue.title}" (by @${issue.author.login})`);
      // 新規issueのコメントもキャッシュに追加
      const comments = await fetchIssueComments(repo, issue.number);
      issueCache[repo].comments[issue.number] = comments;
    }

    // 更新されたissueを検出（updatedAtが変わった）
    const updatedIssues = currentIssues.filter(current => {
      const previous = previousIssues.find(prev => prev.number === current.number);
      return previous && new Date(current.updatedAt) > new Date(previous.updatedAt);
    });

    for (const issue of updatedIssues) {
      // 新しいコメントが追加されたかを確認
      const currentComments = await fetchIssueComments(repo, issue.number);
      const previousComments = issueCache[repo].comments[issue.number] || [];

      const newComments = currentComments.filter(
        current => !previousComments.find(prev => prev.id === current.id)
      );

      if (newComments.length > 0) {
        for (const comment of newComments) {
          log(
            'INFO',
            `💬 新しいコメント: ${repo}#${issue.number} "${issue.title}" (by @${comment.author.login})`
          );
        }

        // コメントキャッシュを更新
        issueCache[repo].comments[issue.number] = currentComments;
      } else {
        // コメントが新しくない場合は、状態変更のみをログ
        log('INFO', `📝 Issue更新: ${repo}#${issue.number} "${issue.title}"`);
      }
    }

    // キャッシュを更新
    issueCache[repo].issues = currentIssues;

  } catch (error) {
    log('ERROR', `リポジトリ監視失敗 (${repo}): ${error.message}`);
  }
}

/**
 * 複数のリポジトリを監視（定期実行用）
 * @param {Array<string>} repos - リポジトリ名配列 (owner/name 形式)
 */
async function monitorRepositories(repos) {
  if (!repos || repos.length === 0) {
    return;
  }

  for (const repo of repos) {
    await monitorRepository(repo);
  }
}

/**
 * キャッシュをリセット（テスト用）
 */
function resetCache() {
  issueCache = {};
}

module.exports = {
  monitorRepositories,
  resetCache,
  fetchIssues,
  fetchIssueComments,
  isValidRepoFormat
};

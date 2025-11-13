// リポジトリ管理モジュール
// GitHubリポジトリの取得機能を担当

const { exec } = require('child_process');
const { promisify } = require('util');
const { log } = require('./logger');

const execAsync = promisify(exec);

/**
 * ghコマンドを使ってリポジトリ情報を取得
 * @returns {Promise<object>} リポジトリ情報 { userRepos, orgRepos, error? }
 */
async function fetchRepositories() {
  try {
    log('INFO', 'リポジトリ情報を取得中...');

    // 自分のリポジトリを取得
    let userRepos = [];
    try {
      const { stdout: userReposOutput } = await execAsync('gh repo list --json name,url,description,owner --limit 100');
      userRepos = JSON.parse(userReposOutput);
    } catch (err) {
      log('WARN', `個人リポジトリの取得に失敗: ${err.message}`);
    }

    // 所属している組織を取得
    let orgs = [];
    try {
      const { stdout: orgsOutput } = await execAsync('gh api user/orgs --jq ".[].login"');
      orgs = orgsOutput.trim().split('\n').filter(org => org);
    } catch (err) {
      log('WARN', `組織一覧の取得に失敗: ${err.message}`);
    }

    // 各組織のリポジトリを取得
    const orgRepos = [];
    for (const org of orgs) {
      try {
        const { stdout: orgReposOutput } = await execAsync(`gh repo list ${org} --json name,url,description,owner --limit 100`);
        const repos = JSON.parse(orgReposOutput);
        orgRepos.push({
          org,
          repos
        });
      } catch (err) {
        log('WARN', `組織 ${org} のリポジトリ取得に失敗: ${err.message}`);
      }
    }

    log('INFO', `取得完了: 個人リポジトリ ${userRepos.length}件, 組織 ${orgs.length}件`);

    return {
      userRepos,
      orgRepos
    };
  } catch (error) {
    log('ERROR', `リポジトリ情報の取得に失敗: ${error.message}`);
    return {
      userRepos: [],
      orgRepos: [],
      error: error.message
    };
  }
}

module.exports = {
  fetchRepositories
};

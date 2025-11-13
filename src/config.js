// 設定管理モジュール
// 設定ファイルの読み込み、保存を担当

const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const { log } = require('./logger');

/**
 * 設定ファイルの存在確認と読み込み、または新規作成
 * @param {string} configDir - 設定ファイルを配置するディレクトリ（デフォルト: ~/.config）
 * @returns {object} 設定オブジェクト
 */
function ensureConfigFile(configDir) {
  try {
    // configDirが指定されていない場合は環境変数またはデフォルト値を使用
    const dir = configDir || process.env.CONFIG_DIR || path.join(os.homedir(), '.config');
    const configFile = path.join(dir, 's4na-gh-observer.yaml');

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log('INFO', `設定ディレクトリを作成しました: ${dir}`);
    }

    // 設定ファイルが存在しない場合はデフォルト設定を作成
    if (!fs.existsSync(configFile)) {
      const defaultConfig = {
        interval: 1000,
        showElapsedTime: true,
        timeFormat: '24h',
        targets: [],
        createdAt: new Date().toISOString()
      };

      const yamlContent = yaml.dump(defaultConfig, {
        indent: 2,
        lineWidth: -1
      });

      fs.writeFileSync(configFile, yamlContent, 'utf8');
      log('INFO', `設定ファイルを作成しました: ${configFile}`);
      return defaultConfig;
    } else {
      // 既存の設定ファイルを読み込む
      const fileContent = fs.readFileSync(configFile, 'utf8');
      const config = yaml.load(fileContent);
      log('INFO', `設定ファイルを読み込みました: ${configFile}`);
      return config;
    }
  } catch (error) {
    log('ERROR', `設定ファイルの処理に失敗しました: ${error.message}`);
    // エラーが発生した場合でもデフォルト設定を返す
    return {
      interval: 1000,
      showElapsedTime: true,
      timeFormat: '24h',
      targets: []
    };
  }
}

/**
 * 設定をYAML形式で保存
 * @param {object} config - 保存する設定オブジェクト
 * @param {string} configDir - 設定ファイルを配置するディレクトリ（デフォルト: ~/.config）
 * @returns {boolean} 保存に成功したかどうか
 */
function saveConfig(config, configDir) {
  try {
    // configDirが指定されていない場合は環境変数またはデフォルト値を使用
    const dir = configDir || process.env.CONFIG_DIR || path.join(os.homedir(), '.config');
    const configFile = path.join(dir, 's4na-gh-observer.yaml');

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: -1
    });

    fs.writeFileSync(configFile, yamlContent, 'utf8');
    log('INFO', `設定を保存しました: ${configFile}`);
    return true;
  } catch (error) {
    log('ERROR', `設定の保存に失敗しました: ${error.message}`);
    return false;
  }
}

module.exports = {
  ensureConfigFile,
  saveConfig
};

// ブラウザ操作モジュール
// ブラウザを開く機能を担当

const { exec } = require('child_process');
const { log } = require('./logger');

/**
 * ブラウザでURLを開く
 * @param {string} url - 開くURL
 */
function openBrowser(url) {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    command = `open ${url}`;
  } else if (platform === 'win32') {
    command = `start ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }

  exec(command, (error) => {
    if (error) {
      log('ERROR', `ブラウザを開けませんでした: ${error.message}`);
    }
  });
}

module.exports = {
  openBrowser
};

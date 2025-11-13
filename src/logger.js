// ログモジュール
// 時刻フォーマット、ログ出力を担当

/**
 * 日付オブジェクトを HH:MM:SS 形式にフォーマットする
 * @param {Date} date - フォーマット対象の日付
 * @returns {string} HH:MM:SS 形式の時刻文字列
 */
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * ログレベルと時刻を含むログを出力する
 * @param {string} level - ログレベル (INFO, WARN, ERROR など)
 * @param {string} message - ログメッセージ
 */
function log(level, message) {
  const now = new Date();
  const timestamp = formatTime(now);
  console.log(`${level} ${timestamp} ${message}`);
}

module.exports = {
  formatTime,
  log
};

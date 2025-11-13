#!/usr/bin/env node

const startTime = Date.now();

const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const timer = setInterval(() => {
  const now = new Date();
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`${formatTime(now)} 経過時間: ${elapsed}秒`);
}, 1000);

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log('\n終了しました');
  process.exit(0);
});

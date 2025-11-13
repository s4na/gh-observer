#!/usr/bin/env node

const startTime = Date.now();

const timer = setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  process.stdout.write(`\r経過時間: ${elapsed}秒`);
}, 1000);

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log('\n終了しました');
  process.exit(0);
});

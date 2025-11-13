#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.config');
const CONFIG_FILE = path.join(CONFIG_DIR, 's4na-gh-observer.yaml');

const ensureConfigFile = () => {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      console.log(`Created config directory: ${CONFIG_DIR}`);
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      const defaultConfig = {
        interval: 1000,
        showElapsedTime: true,
        timeFormat: '24h',
        createdAt: new Date().toISOString()
      };

      const yamlContent = yaml.dump(defaultConfig, {
        indent: 2,
        lineWidth: -1
      });

      fs.writeFileSync(CONFIG_FILE, yamlContent, 'utf8');
      console.log(`Created config file: ${CONFIG_FILE}`);
      return defaultConfig;
    } else {
      const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = yaml.load(fileContent);
      console.log(`Loaded config from: ${CONFIG_FILE}`);
      return config;
    }
  } catch (error) {
    console.error(`Error handling config file: ${error.message}`);
    return {
      interval: 1000,
      showElapsedTime: true,
      timeFormat: '24h'
    };
  }
};

const config = ensureConfigFile();

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
}, config.interval || 1000);

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log('\n終了しました');
  process.exit(0);
});

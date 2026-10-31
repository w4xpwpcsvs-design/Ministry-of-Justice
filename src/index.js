const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILDS_DIR = path.join(DATA_DIR, 'guilds');
const BALANCES_DIR = path.join(DATA_DIR, 'balances');

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const ensureFile = (filePath, defaultValue) => {
  ensureDirectory(path.dirname(filePath));

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
  }
};

const readJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) return fallback;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const getGuildConfigPath = (guildId) => path.join(GUILDS_DIR, `${guildId}.json`);
const getBalancePath = (guildId) => path.join(BALANCES_DIR, `${guildId}.json`);

const defaultGuildConfig = (guildId) => ({
  guildId,
  name: 'Министерство юстиции Российской Федерации',
  city: 'Санкт-Петербург',
  currency: 'балл',
  currencyPlural: 'баллов',
  color: '#1F6FEB',
  welcomeMessage: 'Добро пожаловать в Министерство юстиции Санкт-Петербурга. Начните работу в соответствии с регламентом ведомства.',
  footerText: 'Министерство юстиции Российской Федерации',
  welcomeChannelId: null,
  logChannelId: null,
  adminRoleId: null,
  memberRanks: {},
  memberPositions: {}
});

const ensureGuildConfig = (guildId) => {
  const filePath = getGuildConfigPath(guildId);
  const config = readJson(filePath, defaultGuildConfig(guildId));

  if (!config.memberRanks) config.memberRanks = {};
  if (!config.memberPositions) config.memberPositions = {};
  if (!config.currencyPlural) config.currencyPlural = config.currency + 'ов';

  writeJson(filePath, config);
  return config;
};

const saveGuildConfig = (guildId, config) => {
  const filePath = getGuildConfigPath(guildId);
  writeJson(filePath, config);
};

const getBalanceData = (guildId) => {
  const filePath = getBalancePath(guildId);
  ensureFile(filePath, {});
  return readJson(filePath, {});
};

const saveBalanceData = (guildId, data) => {
  writeJson(getBalancePath(guildId), data);
};

const getMemberBalance = (guildId, memberId) => {
  const data = getBalanceData(guildId);
  return data[memberId] || { balance: 0 };
};

const setMemberBalance = (guildId, memberId, balance, metadata = {}) => {
  const data = getBalanceData(guildId);
  data[memberId] = { balance, ...metadata };
  saveBalanceData(guildId, data);
  return data[memberId];
};

const updateMemberBalance = (guildId, memberId, diff, metadata = {}) => {
  const current = getMemberBalance(guildId, memberId);
  const nextBalance = Math.max(0, (current.balance || 0) + diff);
  return setMemberBalance(guildId, memberId, nextBalance, metadata);
};

const normalizeRankName = (name) => name?.trim();
const normalizePositionName = (name) => name?.trim();

module.exports = {
  ensureDirectory,
  ensureGuildConfig,
  saveGuildConfig,
  getBalanceData,
  saveBalanceData,
  getMemberBalance,
  setMemberBalance,
  updateMemberBalance,
  normalizeRankName,
  normalizePositionName,
  defaultGuildConfig,
  getGuildConfigPath,
  getBalancePath
};


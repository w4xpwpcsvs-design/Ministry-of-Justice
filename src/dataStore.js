const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILDS_DIR = path.join(DATA_DIR, 'guilds');
const BALANCES_DIR = path.join(DATA_DIR, 'balances');

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const ensureFile = (filePath, defaultValue) => {
  ensureDirectory(path.dirname(filePath));
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
};

const readJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) return fallback;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return fallback; }
};

const writeJson = (filePath, data) => {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const defaultGuildConfig = (guildId) => ({
  guildId,
  name: 'Министерство юстиции Российской Федерации',
  city: 'Санкт-Петербург',
  currency: 'балл',
  currencyPlural: 'баллов',
  color: '#1F6FEB',
  welcomeMessage: 'Добро пожаловать в Министерство юстиции Санкт-Петербурга. Ваша служба начинается с соблюдения регламента ведомства.',
  footerText: 'Министерство юстиции Российской Федерации',
  welcomeChannelId: null,
  logChannelId: null,
  adminRoleId: null,
  memberRanks: {},
  memberPositions: {},
  memberDepartments: {},
  orders: [],
  disciplinaryRecords: {}
});

const getGuildConfigPath = (guildId) => path.join(GUILDS_DIR, `${guildId}.json`);
const getBalancePath = (guildId) => path.join(BALANCES_DIR, `${guildId}.json`);

const ensureGuildConfig = (guildId) => {
  const filePath = getGuildConfigPath(guildId);
  const config = readJson(filePath, defaultGuildConfig(guildId));
  config.memberRanks = config.memberRanks || {};
  config.memberPositions = config.memberPositions || {};
  config.memberDepartments = config.memberDepartments || {};
  config.orders = config.orders || [];
  config.disciplinaryRecords = config.disciplinaryRecords || {};
  if (!config.currencyPlural) config.currencyPlural = `${config.currency || 'балл'}ов`;
  writeJson(filePath, config);
  return config;
};

const saveGuildConfig = (guildId, config) => {
  writeJson(getGuildConfigPath(guildId), config);
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

const adjustBalance = (guildId, memberId, delta, metadata = {}) => {
  const current = getMemberBalance(guildId, memberId);
  const next = Math.max(0, (current.balance || 0) + delta);
  return setMemberBalance(guildId, memberId, next, metadata);
};

module.exports = {
  ensureDirectory,
  ensureGuildConfig,
  saveGuildConfig,
  getBalanceData,
  saveBalanceData,
  getMemberBalance,
  setMemberBalance,
  adjustBalance,
  defaultGuildConfig,
  getGuildConfigPath,
  getBalancePath
};






























































































































































































































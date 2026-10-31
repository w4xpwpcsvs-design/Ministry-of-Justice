const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILDS_DIR = path.join(DATA_DIR, 'guilds');
const BALANCES_DIR = path.join(DATA_DIR, 'balances');

const DEFAULT_ACCESS = {
  owner: [],
  minister: [],
  leadership: [],
  department_admin: [],
  staff: []
};

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const ensureFile = (filePath, defaultValue) => {
  ensureDirectory(path.dirname(filePath));
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
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

const defaultGuildConfig = (guildId) => ({
  guildId,
  guildOwnerId: null,
  name: 'Министерство юстиции Российской Федерации',
  city: 'Санкт-Петербург',
  currency: 'балл',
  currencyPlural: 'баллов',
  color: '#1F6FEB',
  welcomeMessage: 'Добро пожаловать в Министерство юстиции Российской Федерации. Ваша служба начинается с соблюдения регламента и дисциплины.',
  footerText: 'Министерство юстиции Российской Федерации',
  welcomeChannelId: null,
  logChannelId: null,
  adminRoleId: null,
  access: { ...DEFAULT_ACCESS },
  employees: [],
  departments: [],
  positions: [],
  ranks: [],
  orders: [],
  tickets: [],
  memberRanks: {},
  memberPositions: {},
  memberDepartments: {},
  disciplinaryRecords: {}
});

const getGuildConfigPath = (guildId) => path.join(GUILDS_DIR, `${guildId}.json`);
const getBalancePath = (guildId) => path.join(BALANCES_DIR, `${guildId}.json`);

const ensureGuildConfig = (guildId) => {
  const filePath = getGuildConfigPath(guildId);
  const config = readJson(filePath, defaultGuildConfig(guildId));
  config.guildOwnerId = config.guildOwnerId || null;
  config.access = { ...DEFAULT_ACCESS, ...(config.access || {}) };
  Object.keys(DEFAULT_ACCESS).forEach((key) => {
    config.access[key] = Array.isArray(config.access[key]) ? config.access[key] : [];
  });

  config.employees = Array.isArray(config.employees) ? config.employees : [];
  config.departments = Array.isArray(config.departments) ? config.departments : [];
  config.positions = Array.isArray(config.positions) ? config.positions : [];
  config.ranks = Array.isArray(config.ranks) ? config.ranks : [];
  config.orders = Array.isArray(config.orders) ? config.orders : [];
  config.tickets = Array.isArray(config.tickets) ? config.tickets : [];
  config.memberRanks = config.memberRanks || {};
  config.memberPositions = config.memberPositions || {};
  config.memberDepartments = config.memberDepartments || {};
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

const getBotOwnerId = () => process.env.BOT_OWNER_ID || process.env.OWNER_ID || '1225811175154122755';

const getAccessEntry = (guildId, userId) => {
  const config = ensureGuildConfig(guildId);
  const access = config.access || { ...DEFAULT_ACCESS };
  for (const [role, users] of Object.entries(access)) {
    if (Array.isArray(users) && users.some((id) => String(id) === String(userId))) {
      return { role, userId };
    }
  }
  return null;
};

const setAccessEntry = (guildId, userId, role, enabled = true) => {
  const config = ensureGuildConfig(guildId);
  const access = config.access || { ...DEFAULT_ACCESS };

  Object.keys(access).forEach((key) => {
    access[key] = Array.isArray(access[key]) ? access[key].filter((id) => String(id) !== String(userId)) : [];
  });

  if (enabled && role && access[role]) {
    access[role] = Array.from(new Set([...(access[role] || []), String(userId)]));
  }

  config.access = { ...DEFAULT_ACCESS, ...access };
  saveGuildConfig(guildId, config);
  return config.access;
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
  getBalancePath,
  getAccessEntry,
  setAccessEntry,
  getBotOwnerId,
  DEFAULT_ACCESS
};

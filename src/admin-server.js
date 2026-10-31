const express = require('express');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');
const {
  ensureGuildConfig,
  saveGuildConfig,
  getBotOwnerId,
  DEFAULT_ACCESS
} = require('./dataStore');

config();

const app = express();
const PORT = Number(process.env.ADMIN_PORT || 3001);
const ADMIN_DIR = path.join(__dirname, '..', 'admin');
const DEFAULT_HTML = path.join(ADMIN_DIR, 'index.html');

const safeList = (value) => Array.isArray(value) ? value : [];
const normalizeGuildId = (guildId) => String(guildId || process.env.GUILD_ID || 'server');

function logSystemEvent(guildId, actorId, action, message, level = 'info') {
  const cfg = ensureGuildConfig(guildId);
  cfg.logs = safeList(cfg.logs);
  cfg.logs.unshift({
    id: Date.now().toString(),
    guildId,
    actorId: actorId || null,
    action,
    message,
    level,
    createdAt: new Date().toISOString()
  });
  cfg.logs = cfg.logs.slice(0, 200);
  saveGuildConfig(guildId, cfg);
}

function getGuildOwnerId(guildId) {
  const cfg = ensureGuildConfig(guildId);
  return cfg.guildOwnerId || null;
}

function isSuperAdmin(userId, guildId = process.env.GUILD_ID || 'server') {
  if (!userId) return false;
  const botOwnerId = String(getBotOwnerId());
  const guildOwnerId = String(getGuildOwnerId(guildId));
  return String(userId) === botOwnerId || String(userId) === guildOwnerId;
}

function hasRoleAccess(userId, requiredRole, guildId = process.env.GUILD_ID || 'server') {
  if (!userId) return false;
  if (isSuperAdmin(userId, guildId)) return true;

  const cfg = ensureGuildConfig(guildId);
  const access = cfg.access || { ...DEFAULT_ACCESS };

  const hierarchy = {
    owner: 5,
    minister: 4,
    leadership: 3,
    department_admin: 2,
    staff: 1
  };

  const matchingRole = Object.entries(access).find(([, ids]) => safeList(ids).map(String).includes(String(userId)));
  const current = matchingRole ? matchingRole[0] : 'staff';
  return (hierarchy[current] || 0) >= (hierarchy[requiredRole] || 0);
}

function requireAdminAccess(req, res, minimumRole = 'leadership', guildIdOverride = null) {
  const guildId = normalizeGuildId(guildIdOverride || req.query.guildId || req.body.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId || req.body.actorId || req.headers['x-user-id'];

  if (!actorId) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (!hasRoleAccess(actorId, minimumRole, guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Insufficient privileges.' });
  }

  return null;
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(ADMIN_DIR));

app.get('/api/system', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const cfg = ensureGuildConfig(guildId);
  res.json({
    guildId,
    name: cfg.name,
    city: cfg.city,
    botOwnerId: getBotOwnerId(),
    guildOwnerId: getGuildOwnerId(guildId),
    roles: Object.keys(DEFAULT_ACCESS),
    access: cfg.access || { ...DEFAULT_ACCESS }
  });
});

app.get('/api/settings', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const cfg = ensureGuildConfig(guildId);
  res.json({
    guildId,
    name: cfg.name,
    city: cfg.city,
    currency: cfg.currency,
    currencyPlural: cfg.currencyPlural,
    color: cfg.color,
    welcomeMessage: cfg.welcomeMessage,
    footerText: cfg.footerText,
    welcomeChannelId: cfg.welcomeChannelId,
    logChannelId: cfg.logChannelId,
    adminRoleId: cfg.adminRoleId,
    access: cfg.access || { ...DEFAULT_ACCESS }
  });
});

app.post('/api/settings', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || req.query.guildId || process.env.GUILD_ID || 'server');
  const authorization = requireAdminAccess(req, res, 'minister', guildId);
  if (authorization) return authorization;

  const cfg = ensureGuildConfig(guildId);
  const allowed = [
    'name',
    'city',
    'currency',
    'currencyPlural',
    'color',
    'welcomeMessage',
    'footerText',
    'welcomeChannelId',
    'logChannelId',
    'adminRoleId'
  ];

  const updates = req.body || {};
  const actorId = req.body.userId || req.body.actorId || req.query.userId || null;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key) && updates[key] !== undefined && updates[key] !== null) {
      cfg[key] = updates[key];
    }
  }

  if (cfg.currency && !cfg.currencyPlural) {
    cfg.currencyPlural = `${cfg.currency}ов`;
  }

  if (updates.currency && !updates.currencyPlural) {
    cfg.currencyPlural = `${updates.currency}ов`;
  }

  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'settings.update', 'Обновлены параметры ведомства', 'info');
  res.json({ success: true, settings: cfg });
});

app.get('/api/logs', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const cfg = ensureGuildConfig(guildId);
  res.json(cfg.logs || []);
});

app.get('/api/access', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const cfg = ensureGuildConfig(guildId);
  res.json(cfg.access || { ...DEFAULT_ACCESS });
});

app.post('/api/access', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, userId, role } = req.body || {};

  if (!userId || !role) {
    return res.status(400).json({ success: false, message: 'userId and role are required.' });
  }

  if (!hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only owner or minister may assign access.' });
  }

  const allowed = ['owner', 'minister', 'leadership', 'department_admin', 'staff'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  }

  const cfg = ensureGuildConfig(guildId);
  const access = { ...DEFAULT_ACCESS, ...(cfg.access || {}) };
  Object.keys(access).forEach((key) => {
    access[key] = safeList(access[key]).filter((id) => String(id) !== String(userId));
  });
  access[role] = Array.from(new Set([...(safeList(access[role])), String(userId)]));
  cfg.access = access;
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'access.assign', `Назначен доступ ${role} для пользователя ${userId}`, 'info');

  res.json({ success: true, access: cfg.access });
});

app.get('/api/employees', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const cfg = ensureGuildConfig(guildId);
  res.json(cfg.employees || []);
});

app.post('/api/employees', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, discordId, fullName, department, position, rank } = req.body || {};

  if (!fullName) return res.status(400).json({ success: false, message: 'Full name is required.' });
  if (!hasRoleAccess(actorId, 'department_admin', guildId) && !hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only leadership may register personnel.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.employees = safeList(cfg.employees);
  cfg.employees.push({
    id: Date.now().toString(),
    discordId: discordId || '',
    fullName,
    department: department || '',
    position: position || '',
    rank: rank || '',
    status: 'active',
    accessLevel: 'staff',
    createdAt: new Date().toISOString()
  });
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'employee.create', `Добавлен сотрудник ${fullName}`, 'info');
  res.json({ success: true, employees: cfg.employees });
});

app.delete('/api/employees/:id', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId;
  if (!hasRoleAccess(actorId, 'department_admin', guildId) && !hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.employees = safeList(cfg.employees).filter((employee) => String(employee.id) !== String(req.params.id));
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'employee.delete', `Удалён сотрудник с идентификатором ${req.params.id}`, 'warning');
  res.json({ success: true, employees: cfg.employees });
});

app.get('/api/departments', (req, res) => {
  const cfg = ensureGuildConfig(normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server'));
  res.json(cfg.departments || []);
});

app.post('/api/departments', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only leadership may create departments.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.departments = safeList(cfg.departments);
  if (!cfg.departments.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) {
    cfg.departments.push({ id: Date.now().toString(), name, createdAt: new Date().toISOString() });
    saveGuildConfig(guildId, cfg);
    logSystemEvent(guildId, actorId, 'department.create', `Создан департамент ${name}`, 'info');
  }
  res.json({ success: true, departments: cfg.departments });
});

app.delete('/api/departments/:id', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId;
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.departments = safeList(cfg.departments).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'department.delete', `Удалён департамент с идентификатором ${req.params.id}`, 'warning');
  res.json({ success: true, departments: cfg.departments });
});

app.get('/api/positions', (req, res) => {
  const cfg = ensureGuildConfig(normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server'));
  res.json(cfg.positions || []);
});

app.post('/api/positions', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Position name is required.' });
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only leadership may manage positions.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.positions = safeList(cfg.positions);
  if (!cfg.positions.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) {
    cfg.positions.push({ id: Date.now().toString(), name, createdAt: new Date().toISOString() });
    saveGuildConfig(guildId, cfg);
    logSystemEvent(guildId, actorId, 'position.create', `Создана должность ${name}`, 'info');
  }
  res.json({ success: true, positions: cfg.positions });
});

app.delete('/api/positions/:id', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId;
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.positions = safeList(cfg.positions).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'position.delete', `Удалена должность с идентификатором ${req.params.id}`, 'warning');
  res.json({ success: true, positions: cfg.positions });
});

app.get('/api/ranks', (req, res) => {
  const cfg = ensureGuildConfig(normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server'));
  res.json(cfg.ranks || []);
});

app.post('/api/ranks', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Rank name is required.' });
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only leadership may manage ranks.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.ranks = safeList(cfg.ranks);
  if (!cfg.ranks.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) {
    cfg.ranks.push({ id: Date.now().toString(), name, createdAt: new Date().toISOString() });
    saveGuildConfig(guildId, cfg);
    logSystemEvent(guildId, actorId, 'rank.create', `Создан чин ${name}`, 'info');
  }
  res.json({ success: true, ranks: cfg.ranks });
});

app.delete('/api/ranks/:id', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId;
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.ranks = safeList(cfg.ranks).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'rank.delete', `Удалён чин с идентификатором ${req.params.id}`, 'warning');
  res.json({ success: true, ranks: cfg.ranks });
});

app.get('/api/orders', (req, res) => {
  const cfg = ensureGuildConfig(normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server'));
  res.json(cfg.orders || []);
});

app.post('/api/orders', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, title, text, author } = req.body || {};
  if (!title || !text) return res.status(400).json({ success: false, message: 'Title and text are required.' });
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only leadership may issue orders.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.orders = safeList(cfg.orders);
  cfg.orders.push({ id: Date.now().toString(), title, text, author: author || 'Ministry', createdAt: new Date().toISOString() });
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'order.create', `Зарегистрирован приказ ${title}`, 'info');
  res.json({ success: true, orders: cfg.orders });
});

app.delete('/api/orders/:id', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId;
  if (!hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.orders = safeList(cfg.orders).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'order.delete', `Удалён приказ с идентификатором ${req.params.id}`, 'warning');
  res.json({ success: true, orders: cfg.orders });
});

app.get('/api/tickets', (req, res) => {
  const cfg = ensureGuildConfig(normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server'));
  res.json(cfg.tickets || []);
});

app.post('/api/tickets', (req, res) => {
  const guildId = normalizeGuildId(req.body.guildId || process.env.GUILD_ID || 'server');
  const { actorId, title, description, category = 'Общие обращения' } = req.body || {};
  if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description are required.' });
  if (!hasRoleAccess(actorId, 'department_admin', guildId) && !hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied. Only departmental/admin staff may create tickets.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.tickets = safeList(cfg.tickets);
  cfg.tickets.push({
    id: Date.now().toString(),
    title,
    description,
    category,
    status: 'new',
    createdAt: new Date().toISOString()
  });
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'ticket.create', `Создано служебное обращение ${title}`, 'info');
  res.json({ success: true, tickets: cfg.tickets });
});

app.delete('/api/tickets/:id', (req, res) => {
  const guildId = normalizeGuildId(req.query.guildId || process.env.GUILD_ID || 'server');
  const actorId = req.query.userId || req.body.userId;
  if (!hasRoleAccess(actorId, 'department_admin', guildId) && !hasRoleAccess(actorId, 'leadership', guildId) && !hasRoleAccess(actorId, 'minister', guildId) && !isSuperAdmin(actorId, guildId)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cfg = ensureGuildConfig(guildId);
  cfg.tickets = safeList(cfg.tickets).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, cfg);
  logSystemEvent(guildId, actorId, 'ticket.delete', `Удалено служебное обращение с идентификатором ${req.params.id}`, 'warning');
  res.json({ success: true, tickets: cfg.tickets });
});

app.get('/', (req, res) => {
  if (fs.existsSync(DEFAULT_HTML)) return res.sendFile(DEFAULT_HTML);
  res.send('<html><body><h1>Ministry of Justice Admin Panel</h1><p>State access system active.</p></body></html>');
});

app.listen(PORT, () => {
  console.log(`[Ministry of Justice] Government panel running on http://localhost:${PORT}`);
});

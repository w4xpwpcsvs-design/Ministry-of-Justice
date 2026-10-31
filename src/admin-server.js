const express = require('express');
const path = require('path');
const fs = require('fs');
const { ensureGuildConfig, saveGuildConfig, getBotOwnerId, getAccessEntry, setAccessEntry } = require('./dataStore');

const app = express();
const PORT = Number(process.env.ADMIN_PORT || 3001);
const DEFAULT_HTML = path.join(__dirname, '..', 'admin', 'index.html');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'admin')));

const safeRead = (guildId) => ensureGuildConfig(guildId);

const isBotOwner = (userId) => userId && String(userId) === String(getBotOwnerId());
const isGuildOwner = (guild, userId) => guild && userId && String(guild.ownerId) === String(userId);

const getBaseAccessSummary = (guildId) => {
  const config = safeRead(guildId);
  return {
    owner: config.access.owner || [],
    minister: config.access.minister || [],
    leadership: config.access.leadership || [],
    department_admin: config.access.department_admin || [],
    staff: config.access.staff || []
  };
};

app.get('/api/system', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json({
    guildId,
    name: config.name,
    city: config.city,
    access: getBaseAccessSummary(guildId),
    botOwnerId: getBotOwnerId(),
    roles: ['owner', 'minister', 'leadership', 'department_admin', 'staff']
  });
});

app.get('/api/access', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  res.json(getBaseAccessSummary(guildId));
});

app.post('/api/access', (req, res) => {
  const { guildId = process.env.GUILD_ID || 'server', userId, role } = req.body || {};
  if (!userId || !role) return res.status(400).json({ success: false, message: 'userId and role are required.' });
  const config = safeRead(guildId);
  const allowed = ['owner', 'minister', 'leadership', 'department_admin', 'staff'];
  if (!allowed.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });

  const access = config.access || { owner: [], minister: [], leadership: [], department_admin: [], staff: [] };
  Object.keys(access).forEach((key) => {
    access[key] = (access[key] || []).filter((id) => String(id) !== String(userId));
  });
  access[role] = Array.from(new Set([...(access[role] || []), String(userId)]));
  config.access = access;
  saveGuildConfig(guildId, config);
  res.json({ success: true, access: config.access });
});

app.get('/api/positions', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json(config.positions || []);
});

app.post('/api/positions', (req, res) => {
  const guildId = req.body.guildId || process.env.GUILD_ID || 'server';
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Position name is required.' });
  const config = safeRead(guildId);
  config.positions = Array.isArray(config.positions) ? config.positions : [];
  if (!config.positions.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) {
    config.positions.push({ id: Date.now().toString(), name, createdAt: new Date().toISOString() });
    saveGuildConfig(guildId, config);
  }
  res.json({ success: true, positions: config.positions });
});

app.delete('/api/positions/:id', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  config.positions = (config.positions || []).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, config);
  res.json({ success: true, positions: config.positions });
});

app.get('/api/ranks', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json(config.ranks || []);
});

app.post('/api/ranks', (req, res) => {
  const guildId = req.body.guildId || process.env.GUILD_ID || 'server';
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Rank name is required.' });
  const config = safeRead(guildId);
  config.ranks = Array.isArray(config.ranks) ? config.ranks : [];
  if (!config.ranks.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) {
    config.ranks.push({ id: Date.now().toString(), name, createdAt: new Date().toISOString() });
    saveGuildConfig(guildId, config);
  }
  res.json({ success: true, ranks: config.ranks });
});

app.delete('/api/ranks/:id', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  config.ranks = (config.ranks || []).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, config);
  res.json({ success: true, ranks: config.ranks });
});

app.get('/api/departments', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json(config.departments || []);
});

app.post('/api/departments', (req, res) => {
  const guildId = req.body.guildId || process.env.GUILD_ID || 'server';
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });
  const config = safeRead(guildId);
  config.departments = Array.isArray(config.departments) ? config.departments : [];
  if (!config.departments.some((item) => String(item.name).toLowerCase() === String(name).toLowerCase())) {
    config.departments.push({ id: Date.now().toString(), name, createdAt: new Date().toISOString() });
    saveGuildConfig(guildId, config);
  }
  res.json({ success: true, departments: config.departments });
});

app.delete('/api/departments/:id', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  config.departments = (config.departments || []).filter((item) => String(item.id) !== String(req.params.id));
  saveGuildConfig(guildId, config);
  res.json({ success: true, departments: config.departments });
});

app.get('/api/orders', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json(config.orders || []);
});

app.post('/api/orders', (req, res) => {
  const guildId = req.body.guildId || process.env.GUILD_ID || 'server';
  const { title, text, author } = req.body || {};
  if (!title || !text) return res.status(400).json({ success: false, message: 'Title and text are required.' });
  const config = safeRead(guildId);
  config.orders = Array.isArray(config.orders) ? config.orders : [];
  config.orders.push({ id: Date.now().toString(), title, text, author: author || 'Ministry', createdAt: new Date().toISOString() });
  saveGuildConfig(guildId, config);
  res.json({ success: true, orders: config.orders });
});

app.get('/api/tickets', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json(config.tickets || []);
});

app.post('/api/tickets', (req, res) => {
  const guildId = req.body.guildId || process.env.GUILD_ID || 'server';
  const { title, description, category = 'Общие обращения', priority = 'medium' } = req.body || {};
  if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description are required.' });
  const config = safeRead(guildId);
  config.tickets = Array.isArray(config.tickets) ? config.tickets : [];
  config.tickets.push({
    id: Date.now().toString(),
    title,
    description,
    category,
    priority,
    status: 'new',
    createdAt: new Date().toISOString()
  });
  saveGuildConfig(guildId, config);
  res.json({ success: true, tickets: config.tickets });
});

app.get('/api/employees', (req, res) => {
  const guildId = req.query.guildId || process.env.GUILD_ID || 'server';
  const config = safeRead(guildId);
  res.json(config.employees || []);
});

app.post('/api/employees', (req, res) => {
  const guildId = req.body.guildId || process.env.GUILD_ID || 'server';
  const { discordId, fullName, department, position, rank } = req.body || {};
  if (!fullName) return res.status(400).json({ success: false, message: 'Full name is required.' });
  const config = safeRead(guildId);
  config.employees = Array.isArray(config.employees) ? config.employees : [];
  config.employees.push({
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
  saveGuildConfig(guildId, config);
  res.json({ success: true, employees: config.employees });
});

app.get('/', (req, res) => {
  if (fs.existsSync(DEFAULT_HTML)) return res.sendFile(DEFAULT_HTML);
  res.send('<html><body><h1>Ministry of Justice Admin Panel</h1><p>Panel is available.</p></body></html>');
});

app.listen(PORT, () => {
  console.log(`[Ministry of Justice] Admin panel running on http://localhost:${PORT}`);
});

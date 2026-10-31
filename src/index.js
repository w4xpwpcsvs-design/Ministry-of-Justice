const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Events } = require('discord.js');
const { config } = require('dotenv');
const { RANKS, POSITIONS, DEPARTMENTS } = require('./commands');
const { registerSlashCommands } = require('./deploy-commands');

config();

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
  welcomeMessage: 'Добро пожаловать в Министерство юстиции Санкт-Петербурга. Ваша служба начинается с соблюдения регламента и дисциплины.',
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

const ensureGuildConfig = (guildId) => {
  const filePath = getGuildConfigPath(guildId);
  const config = readJson(filePath, defaultGuildConfig(guildId));

  config.memberRanks = config.memberRanks || {};
  config.memberPositions = config.memberPositions || {};
  config.memberDepartments = config.memberDepartments || {};
  config.orders = config.orders || [];
  config.disciplinaryRecords = config.disciplinaryRecords || {};

  if (!config.currencyPlural) {
    config.currencyPlural = `${config.currency || 'балл'}ов`;
  }

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
  const nextBalance = Math.max(0, (current.balance || 0) + delta);
  return setMemberBalance(guildId, memberId, nextBalance, metadata);
};

const BOT_COLOR = '#1F6FEB';

const hasAdminAccess = (member) => {
  if (!member) return false;
  if (member.permissions && member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  if (member.permissions && member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;

  const config = ensureGuildConfig(member.guild.id);
  if (config.adminRoleId) {
    const role = member.guild.roles.cache.get(config.adminRoleId);
    if (role && member.roles.cache.has(role.id)) return true;
  }

  return false;
};

const sendToLogChannel = async (guild, messageText, color = BOT_COLOR) => {
  const config = ensureGuildConfig(guild.id);
  if (!config.logChannelId) return;

  const channel = guild.channels.cache.get(config.logChannelId) || await guild.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder().setColor(color).setDescription(messageText).setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
};

const ensureRole = async (guild, roleName, color = BOT_COLOR) => {
  const existing = guild.roles.cache.find((role) => role.name === roleName);
  if (existing) return existing;

  return guild.roles.create({
    name: roleName,
    color,
    reason: 'Назначение служебной роли в Министерстве юстиции'
  });
};

const buildStructureEmbed = () => {
  return new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle('Структура Министерства юстиции Российской Федерации')
    .setDescription('Служебная иерархия ведомства')
    .addFields(
      { name: 'Руководство', value: 'Министр юстиции РФ\nПервый заместитель\nСтатс-секретарь — заместитель Министра', inline: false },
      { name: 'Аппарат', value: 'Аппарат Министра\nУправление делами\nКадровая служба', inline: false },
      { name: 'Правовой блок', value: 'Правовой департамент\nДепартамент международного права\nДепартамент уголовно-правовой политики', inline: false },
      { name: 'Административный блок', value: 'Департамент исполнения и контроля\nДепартамент государственной регистрации\nДепартамент правовой экспертизы', inline: false },
      { name: 'Поддержка', value: 'Юридическая служба федеральных органов\nУправление документооборота\nОтдел служебной проверки', inline: false }
    )
    .setTimestamp();
};

const buildHelpEmbed = (guild) => {
  const config = ensureGuildConfig(guild.id);
  return new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle('Справка Минюста')
    .setDescription(`Служебная справка по системе **${config.name}**.`)
    .addFields(
      { name: 'Основные команды', value: '/minjust-help\n/minjust-structure\n/minjust-profile\n/minjust-status\n/minjust-balance\n/minjust-rank\n/minjust-position\n/minjust-department\n/minjust-order\n/minjust-disciplinary\n/minjust-config', inline: false },
      { name: 'Классные чины', value: RANKS.slice(0, 6).map((rank, idx) => `${idx + 1}. ${rank}`).join('\n') + '\n…', inline: true },
      { name: 'Должности', value: POSITIONS.slice(0, 8).map((position, idx) => `${idx + 1}. ${position}`).join('\n') + '\n…', inline: true },
      { name: 'Подразделения', value: DEPARTMENTS.slice(0, 6).map((dep, idx) => `${idx + 1}. ${dep}`).join('\n') + '\n…', inline: false },
      { name: 'Примечание', value: 'Для проведения служебных операций необходимы полномочия руководителя или роль администратора.', inline: false }
    )
    .setFooter({ text: config.footerText || 'Министерство юстиции Российской Федерации' })
    .setTimestamp();
};

const buildProfileEmbed = async (guild, targetUser) => {
  const config = ensureGuildConfig(guild.id);
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const balance = getMemberBalance(guild.id, targetUser.id).balance || 0;
  const rank = config.memberRanks[targetUser.id] || 'Не назначен';
  const position = config.memberPositions[targetUser.id] || 'Не назначена';
  const department = config.memberDepartments[targetUser.id] || 'Не назначено';
  const disciplinary = config.disciplinaryRecords[targetUser.id] || [];

  return new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle(`Служебная карточка: ${targetUser.tag}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: 'Ник', value: targetUser.displayName || targetUser.username, inline: true },
      { name: 'Классный чин', value: rank, inline: true },
      { name: 'Должность', value: position, inline: true },
      { name: 'Подразделение', value: department, inline: true },
      { name: 'Баланс', value: `${balance} ${config.currencyPlural}`, inline: true },
      { name: 'Дисциплинарные записи', value: String(disciplinary.length), inline: true },
      { name: 'Статус', value: member && member.roles.cache.some((role) => role.name.includes('Министерство') || role.name.includes('Юстиции')) ? 'Служба ведётся в структуре ведомства' : 'Статус не подтверждён', inline: true }
    )
    .setFooter({ text: config.footerText || 'Министерство юстиции Российской Федерации' })
    .setTimestamp();
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Бот запущен: ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'Министерство юстиции Российской Федерации', type: 2 }],
    status: 'online'
  });
});

client.on(Events.GuildMemberAdd, async (member) => {
  const config = ensureGuildConfig(member.guild.id);
  if (!config.welcomeChannelId) return;

  const channel = member.guild.channels.cache.get(config.welcomeChannelId) || await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const welcomeText = config.welcomeMessage || 'Добро пожаловать в Министерство юстиции Российской Федерации. Ваша служба начинается с соблюдения регламента.';
  await channel.send({ content: `${member.toString()} ${welcomeText}` }).catch(() => {});
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild } = interaction;

  if (commandName === 'minjust-help') {
    const topic = interaction.options.getString('topic') || 'overview';
    const config = ensureGuildConfig(guild.id);

    if (topic === 'commands') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Служебные команды Минюста')
        .setDescription('Нормативный перечень команд ведомства')
        .addFields(
          { name: '/minjust-balance', value: 'Проверка, выдача, снятие и корректировка баллов.' },
          { name: '/minjust-rank', value: 'Назначение и снятие классных чинов.' },
          { name: '/minjust-position', value: 'Назначение и снятие должностей.' },
          { name: '/minjust-department', value: 'Назначение подразделений и структур.' },
          { name: '/minjust-order', value: 'Реестр приказов и распоряжений.' },
          { name: '/minjust-disciplinary', value: 'Дисциплинарные меры и взыскания.' },
          { name: '/minjust-config', value: 'Настройки ведомства.' },
          { name: '/minjust-profile', value: 'Служебная карточка сотрудника.' }
        )
        .setFooter({ text: config.footerText || 'Министерство юстиции Российской Федерации' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (topic === 'structure') {
      await interaction.reply({ embeds: [buildStructureEmbed()], ephemeral: true });
      return;
    }

    if (topic === 'ranks') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Классные чины')
        .setDescription(RANKS.map((rank, index) => `${index + 1}. ${rank}`).join('\n'))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (topic === 'positions') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Должности')
        .setDescription(POSITIONS.map((position, index) => `${index + 1}. ${position}`).join('\n'))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    await interaction.reply({ embeds: [buildHelpEmbed(guild)], ephemeral: true });
    return;
  }

  if (commandName === 'minjust-structure') {
    await interaction.reply({ embeds: [buildStructureEmbed()] });
    return;
  }

  if (commandName === 'minjust-profile') {
    const user = interaction.options.getUser('user') || interaction.user;
    const profileEmbed = await buildProfileEmbed(guild, user);
    await interaction.reply({ embeds: [profileEmbed] });
    return;
  }

  if (commandName === 'minjust-status') {
    const config = ensureGuildConfig(guild.id);
    const members = await guild.members.fetch();
    const totalMembers = members.size;
    const totalBalance = Array.from(members.values()).reduce((sum, member) => sum + (getMemberBalance(guild.id, member.id).balance || 0), 0);

    const embed = new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle('Статус ведомства')
      .setDescription(`Служебный мониторинг ${config.name}`)
      .addFields(
        { name: 'Сотрудников', value: String(totalMembers), inline: true },
        { name: 'Суммарный баланс', value: `${totalBalance} ${config.currencyPlural}`, inline: true },
        { name: 'Город', value: config.city, inline: true },
        { name: 'Подразделения', value: String(DEPARTMENTS.length), inline: true },
        { name: 'Чины', value: String(RANKS.length), inline: true },
        { name: 'Должности', value: String(POSITIONS.length), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (commandName === 'minjust-balance') {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guildConfig = ensureGuildConfig(guild.id);

    if (subcommand === 'show') {
      const balance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const rank = guildConfig.memberRanks[targetUser.id] || 'Не назначен';
      const position = guildConfig.memberPositions[targetUser.id] || 'Не назначена';
      const department = guildConfig.memberDepartments[targetUser.id] || 'Не назначено';

      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Проверка служебного баланса')
        .setDescription(`Проверка баланса для ${targetUser}`)
        .addFields(
          { name: 'Сотрудник', value: targetUser.tag, inline: true },
          { name: 'Классный чин', value: rank, inline: true },
          { name: 'Должность', value: position, inline: true },
          { name: 'Подразделение', value: department, inline: true },
          { name: 'Баланс', value: `${balance} ${guildConfig.currencyPlural}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'У вас нет полномочий для служебных расчётов.', ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason') || 'Без указания основания';

    if (subcommand === 'add') {
      const previousBalance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const updated = adjustBalance(guild.id, targetUser.id, amount, { reason, updatedBy: interaction.user.id, lastUpdated: new Date().toISOString() });
      const embed = new EmbedBuilder()
        .setColor('#10B981')
        .setTitle('Начисление баллов')
        .setDescription(`Сотруднику ${targetUser} начислено ${amount} ${guildConfig.currencyPlural}.`)
        .addFields(
          { name: 'Основание', value: reason },
          { name: 'Предыдущий баланс', value: `${previousBalance}` },
          { name: 'Текущий баланс', value: `${updated.balance}` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendToLogChannel(guild, `**Начисление:** ${interaction.user} начислил ${targetUser} ${amount} ${guildConfig.currencyPlural}. Основание: ${reason}.`, '#10B981');
      return;
    }

    if (subcommand === 'remove') {
      const previousBalance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const updated = adjustBalance(guild.id, targetUser.id, -amount, { reason, updatedBy: interaction.user.id, lastUpdated: new Date().toISOString() });
      const embed = new EmbedBuilder()
        .setColor('#D93B3B')
        .setTitle('Удержание баллов')
        .setDescription(`С сотрудника ${targetUser} удержано ${amount} ${guildConfig.currencyPlural}.`)
        .addFields(
          { name: 'Основание', value: reason },
          { name: 'Предыдущий баланс', value: `${previousBalance}` },
          { name: 'Текущий баланс', value: `${updated.balance}` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendToLogChannel(guild, `**Удержание:** ${interaction.user} удержал у ${targetUser} ${amount} ${guildConfig.currencyPlural}. Основание: ${reason}.`, '#D93B3B');
      return;
    }

    if (subcommand === 'set') {
      const previousBalance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const updated = setMemberBalance(guild.id, targetUser.id, amount, { reason, updatedBy: interaction.user.id, lastUpdated: new Date().toISOString() });
      const embed = new EmbedBuilder()
        .setColor('#F59E0B')
        .setTitle('Корректировка баланса')
        .setDescription(`Баланс ${targetUser} установлен в размере ${amount} ${guildConfig.currencyPlural}.`)
        .addFields(
          { name: 'Основание', value: reason },
          { name: 'Предыдущий баланс', value: `${previousBalance}` },
          { name: 'Текущий баланс', value: `${updated.balance}` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendToLogChannel(guild, `**Корректировка баланса:** ${interaction.user} установил ${targetUser} баланс ${amount} ${guildConfig.currencyPlural}. Основание: ${reason}.`, '#F59E0B');
    }
    return;
  }

  if (commandName === 'minjust-rank') {
    const subcommand = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (subcommand === 'list') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Классные чины')
        .setDescription(RANKS.map((rank, index) => `${index + 1}. ${rank}`).join('\n'))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'Недостаточно полномочий для назначения классных чинов.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');

    if (subcommand === 'assign') {
      const rankName = interaction.options.getString('rank');
      if (!RANKS.includes(rankName)) {
        await interaction.reply({ content: 'Указанный чин не найден в реестре Министерства.', ephemeral: true });
        return;
      }

      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден.', ephemeral: true });
        return;
      }

      const role = await ensureRole(guild, rankName, 0x1f6feb);
      await member.roles.add(role).catch(() => {});
      guildConfig.memberRanks[targetUser.id] = rankName;
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${targetUser} присвоен чин: ${rankName}.` });
      await sendToLogChannel(guild, `**Назначение чина:** ${interaction.user} присвоил ${targetUser} чин **${rankName}**.`, '#1F6FEB');
      return;
    }

    if (subcommand === 'clear') {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден.', ephemeral: true });
        return;
      }

      const currentRank = guildConfig.memberRanks[targetUser.id];
      if (currentRank) {
        const role = guild.roles.cache.find((rankRole) => rankRole.name === currentRank);
        if (role) await member.roles.remove(role).catch(() => {});
      }

      delete guildConfig.memberRanks[targetUser.id];
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${targetUser} снят чин.` });
      await sendToLogChannel(guild, `**Снятие чина:** ${interaction.user} снял чин с ${targetUser}.`, '#D93B3B');
    }
    return;
  }

  if (commandName === 'minjust-position') {
    const subcommand = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (subcommand === 'list') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Должности')
        .setDescription(POSITIONS.map((position, index) => `${index + 1}. ${position}`).join('\n'))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'Недостаточно полномочий для назначения должностей.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');

    if (subcommand === 'assign') {
      const positionName = interaction.options.getString('position');
      if (!POSITIONS.includes(positionName)) {
        await interaction.reply({ content: 'Указанная должность не существует в реестре ведомства.', ephemeral: true });
        return;
      }

      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден.', ephemeral: true });
        return;
      }

      const role = await ensureRole(guild, positionName, 0x10b981);
      await member.roles.add(role).catch(() => {});
      guildConfig.memberPositions[targetUser.id] = positionName;
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${targetUser} назначена должность: ${positionName}.` });
      await sendToLogChannel(guild, `**Назначение должности:** ${interaction.user} назначил ${targetUser} на должность **${positionName}**.`, '#10B981');
      return;
    }

    if (subcommand === 'clear') {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден.', ephemeral: true });
        return;
      }

      const currentPosition = guildConfig.memberPositions[targetUser.id];
      if (currentPosition) {
        const role = guild.roles.cache.find((positionRole) => positionRole.name === currentPosition);
        if (role) await member.roles.remove(role).catch(() => {});
      }

      delete guildConfig.memberPositions[targetUser.id];
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${targetUser} снята должность.` });
      await sendToLogChannel(guild, `**Снятие должности:** ${interaction.user} снял должность с ${targetUser}.`, '#D93B3B');
    }
    return;
  }

  if (commandName === 'minjust-department') {
    const subcommand = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (subcommand === 'list') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Подразделения ведомства')
        .setDescription(DEPARTMENTS.map((department, index) => `${index + 1}. ${department}`).join('\n'))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'Недостаточно полномочий для управления подразделениями.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');

    if (subcommand === 'assign') {
      const departmentName = interaction.options.getString('department');
      if (!DEPARTMENTS.includes(departmentName)) {
        await interaction.reply({ content: 'Указан��ое подразделение не найдено в реестре ведомства.', ephemeral: true });
        return;
      }

      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден.', ephemeral: true });
        return;
      }

      const role = await ensureRole(guild, departmentName, 0x2f6fed);
      await member.roles.add(role).catch(() => {});
      guildConfig.memberDepartments[targetUser.id] = departmentName;
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${targetUser} назначено подразделение: ${departmentName}.` });
      await sendToLogChannel(guild, `**Назначение подразделения:** ${interaction.user} назначил ${targetUser} в подразделение **${departmentName}**.`, '#2F6FED');
      return;
    }

    if (subcommand === 'clear') {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден.', ephemeral: true });
        return;
      }

      const currentDepartment = guildConfig.memberDepartments[targetUser.id];
      if (currentDepartment) {
        const role = guild.roles.cache.find((departmentRole) => departmentRole.name === currentDepartment);
        if (role) await member.roles.remove(role).catch(() => {});
      }

      delete guildConfig.memberDepartments[targetUser.id];
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${targetUser} снято подразделение.` });
      await sendToLogChannel(guild, `**Снятие подразделения:** ${interaction.user} снял подразделение с ${targetUser}.`, '#D93B3B');
    }
    return;
  }

  if (commandName === 'minjust-order') {
    const subcommand = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (subcommand === 'list') {
      if (!guildConfig.orders || guildConfig.orders.length === 0) {
        await interaction.reply({ content: 'Приказной журнал пуст. Доступных приказов нет.', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Приказы и распоряжения')
        .setDescription(guildConfig.orders.map((order, index) => `**${index + 1}. ${order.title}**\n${order.text}\n_Автор: ${order.author}_`).join('\n\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'Недостаточно полномочий для деятельности по приказам.', ephemeral: true });
      return;
    }

    if (subcommand === 'add') {
      const title = interaction.options.getString('title');
      const text = interaction.options.getString('text');
      guildConfig.orders.push({ title, text, author: interaction.user.tag, createdAt: new Date().toISOString() });
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Приказ **${title}** зарегистрирован в журнале.` });
      await sendToLogChannel(guild, `**Приказ:** ${interaction.user} зарегистрировал приказ **${title}**.`, '#1F6FEB');
      return;
    }

    if (subcommand === 'clear') {
      guildConfig.orders = [];
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: 'Приказной журнал очищен.' });
      await sendToLogChannel(guild, `**Очистка приказного журнала:** ${interaction.user} провёл очистку приказного журнала.`, '#D93B3B');
    }
    return;
  }

  if (commandName === 'minjust-disciplinary') {
    const subcommand = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (subcommand === 'list') {
      const allRecords = Object.entries(guildConfig.disciplinaryRecords || {});
      if (allRecords.length === 0) {
        await interaction.reply({ content: 'Дисциплинарный реестр пуст.', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#D93B3B')
        .setTitle('Дисциплинарный реестр')
        .setDescription(allRecords.map(([userId, records]) => `**<@${userId}>**\n${records.map((record) => `- ${record.type}: ${record.reason} (${new Date(record.date).toLocaleDateString('ru-RU')} )`).join('\n')}`).join('\n\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'Недостаточно полномочий для ведения дисциплинарного реестра.', ephemeral: true });
      return;
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user');
      const type = interaction.options.getString('type');
      const reason = interaction.options.getString('reason');
      const list = guildConfig.disciplinaryRecords[user.id] || [];
      list.push({ type, reason, date: new Date().toISOString() });
      guildConfig.disciplinaryRecords[user.id] = list;
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Сотруднику ${user} внесена дисциплинарная запись: ${type}.` });
      await sendToLogChannel(guild, `**Дисциплинарное взыскание:** ${interaction.user} внес ${user} запись **${type}** по причине: ${reason}.`, '#D93B3B');
      return;
    }

    if (subcommand === 'clear') {
      const user = interaction.options.getUser('user');
      delete guildConfig.disciplinaryRecords[user.id];
      saveGuildConfig(guild.id, guildConfig);
      await interaction.reply({ content: `Дисциплинарные записи для ${user} удалены.` });
      await sendToLogChannel(guild, `**Снятие дисциплинарной записи:** ${interaction.user} очистил дисциплинарную запись ${user}.`, '#D93B3B');
    }
    return;
  }

  if (commandName === 'minjust-config') {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view') {
      const config = ensureGuildConfig(guild.id);
      const embed = new EmbedBuilder()
        .setColor(BOT_COLOR)
        .setTitle('Настройки ведомства')
        .addFields(
          { name: 'Название', value: config.name, inline: true },
          { name: 'Город', value: config.city, inline: true },
          { name: 'Валюта', value: config.currency, inline: true },
          { name: 'Цвет', value: config.color, inline: true },
          { name: 'Канал приветствия', value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Не задан', inline: true },
          { name: 'Канал логов', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Не задан', inline: true },
          { name: 'Роль администратора', value: config.adminRoleId ? `<@&${config.adminRoleId}>` : 'Не задана', inline: true },
          { name: 'Подпись', value: config.footerText || 'Отсутствует', inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'Недостаточно полномочий для изменения настроек ведомства.', ephemeral: true });
      return;
    }

    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');
    const config = ensureGuildConfig(guild.id);

    if (key === 'welcomeChannel' || key === 'logChannel' || key === 'adminRole') {
      const cleanValue = value.replace(/[<>#&]/g, '').trim();
      if (key === 'welcomeChannel') config.welcomeChannelId = cleanValue;
      if (key === 'logChannel') config.logChannelId = cleanValue;
      if (key === 'adminRole') config.adminRoleId = cleanValue;
    } else {
      config[key] = value;
    }

    if (key === 'welcomeMessage') config.welcomeMessage = value;
    if (key === 'currency') {
      config.currency = value;
      config.currencyPlural = `${value}ов`;
    }
    if (key === 'name') config.name = value;
    if (key === 'city') config.city = value;
    if (key === 'color') config.color = value;
    if (key === 'footerText') config.footerText = value;

    saveGuildConfig(guild.id, config);
    await interaction.reply({ content: `Параметр **${key}** обновлён.` });
    await sendToLogChannel(guild, `**Настройка ведомства:** ${interaction.user} изменил параметр **${key}**.`, '#1F6FEB');
    return;
  }
});

registerSlashCommands().catch(() => {});
client.login(process.env.DISCORD_TOKEN);

module.exports = {
  client,
  hasAdminAccess,
  ensureRole,
  ensureGuildConfig,
  saveGuildConfig,
  getMemberBalance,
  setMemberBalance,
  adjustBalance
};

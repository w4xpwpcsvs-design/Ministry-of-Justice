const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Events } = require('discord.js');
const { config } = require('dotenv');
const { ensureGuildConfig, saveGuildConfig, getMemberBalance, setMemberBalance, adjustBalance } = require('./dataStore');
const { RANKS, POSITIONS, DEPARTMENTS, getSlashCommands } = require('./commands');

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const botColor = '#1F6FEB';

const hasAdminAccess = (member) => {
  if (!member) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;

  const guildConfig = ensureGuildConfig(member.guild.id);
  if (guildConfig.adminRoleId) {
    const role = member.guild.roles.cache.get(guildConfig.adminRoleId);
    if (role && member.roles.cache.has(role.id)) return true;
  }

  return false;
};

const sendToLogChannel = async (guild, messageText, color = botColor) => {
  const config = ensureGuildConfig(guild.id);
  if (!config.logChannelId) return;

  const channel = guild.channels.cache.get(config.logChannelId) || await guild.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(messageText)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
};

const ensureRole = async (guild, roleName, color = botColor) => {
  const existing = guild.roles.cache.find(role => role.name === roleName);
  if (existing) return existing;

  return guild.roles.create({
    name: roleName,
    color,
    reason: 'Назначение служебной роли Министерства юстиции'
  });
};

const buildProfileEmbed = async (guild, targetUser) => {
  const config = ensureGuildConfig(guild.id);
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const rank = config.memberRanks[targetUser.id] || 'Не назначен';
  const position = config.memberPositions[targetUser.id] || 'Не назначена';
  const balance = getMemberBalance(guild.id, targetUser.id).balance || 0;

  return new EmbedBuilder()
    .setColor(botColor)
    .setTitle(`Служебная карточка: ${targetUser.tag}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: 'ФИО / ник', value: targetUser.displayName || targetUser.username, inline: true },
      { name: 'Классный чин', value: rank, inline: true },
      { name: 'Должность', value: position, inline: true },
      { name: 'Баланс', value: `${balance} ${config.currencyPlural}`, inline: true },
      { name: 'Статус', value: member?.roles.cache.some(role => role.name.includes('Министерство')) ? 'Ведётся служба в ведомстве' : 'Принадлежность не подтверждена', inline: true },
      { name: 'Подразделение', value: config.name, inline: true }
    )
    .setFooter({ text: config.footerText || 'Министерство юстиции Российской Федерации' })
    .setTimestamp();
};

const buildStructureEmbed = () => new EmbedBuilder()
  .setColor(botColor)
  .setTitle('Структура Министерства юстиции Российской Федерации')
  .setDescription('Служебная схема ведомства и основных структурных подразделений.')
  .addFields(
    { name: '1. Руководство', value: 'Министр юстиции Российской Федерации\nПервый заместитель Министра\nСтатс-секретарь — заместитель Министра', inline: false },
    { name: '2. Аппарат', value: 'Аппарат Министра юстиции Российской Федерации\nУправление делами\nКадровая служба', inline: false },
    { name: '3. Правовой блок', value: 'Правовой департамент\nДепартамент международного права\nДепартамент уголовно-правовой политики', inline: false },
    { name: '4. Административный блок', value: 'Департамент исполнения и контроля\nДепартамент государственной регистрации\nОтдел внутреннего аудита', inline: false },
    { name: '5. Подразделения поддержки', value: 'Юридическая служба федеральных органов\nУправление документооборота\nОтдел служебных проверок', inline: false }
  )
  .setTimestamp();

const buildHelpEmbed = () => new EmbedBuilder()
  .setColor(botColor)
  .setTitle('Справка по системе Минюста')
  .setDescription('Нормативное руководство по служебным операциям и структуре ведомства.')
  .addFields(
    { name: 'Основные команды', value: '/minjust-help\n/minjust-structure\n/minjust-profile\n/minjust-status\n/minjust-balance\n/minjust-rank\n/minjust-position\n/minjust-config', inline: false },
    { name: 'Структура ведомства', value: DEPARTMENTS.slice(0, 6).map((item, idx) => `${idx + 1}. ${item}`).join('\n'), inline: false },
    { name: 'Классные чины', value: RANKS.slice(0, 6).map((item, idx) => `${idx + 1}. ${item}`).join('\n') + '\n…', inline: true },
    { name: 'Должности', value: POSITIONS.slice(0, 8).map((item, idx) => `${idx + 1}. ${item}`).join('\n') + '\n…', inline: true },
    { name: 'Примечание', value: 'Команды для должностных лиц и администраторов доступны при наличии полномочий или роли администратора.', inline: false }
  )
  .setFooter({ text: 'Министерство юстиции Российской Федерации — служебный регламент' })
  .setTimestamp();

client.once(Events.ClientReady, () => {
  console.log(`Бот запущен: ${client.user.tag}`);
  client.user.setPresence({
    activities: [{
      name: 'Министерство юстиции Российской Федерации',
      type: 2
    }],
    status: 'online'
  });
});

client.on(Events.GuildMemberAdd, async (member) => {
  const config = ensureGuildConfig(member.guild.id);
  if (!config.welcomeChannelId) return;

  const channel = member.guild.channels.cache.get(config.welcomeChannelId) || await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const welcomeText = config.welcomeMessage || 'Добро пожаловать в Министерство юстиции Российской Федерации. Ваша служба начинается с соблюдения регламента ведомства.';

  await channel.send({
    content: `${member.toString()} ${welcomeText}`
  }).catch(() => {});
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild } = interaction;

  if (commandName === 'minjust-help') {
    await interaction.reply({ embeds: [buildHelpEmbed()], ephemeral: true });
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
    const totalBalance = Array.from(members.values()).reduce((sum, member) => {
      const value = getMemberBalance(guild.id, member.id).balance || 0;
      return sum + value;
    }, 0);

    const embed = new EmbedBuilder()
      .setColor(botColor)
      .setTitle('Статус ведомства')
      .setDescription(`Служебный мониторинг ${config.name}`)
      .addFields(
        { name: 'Общее число сотрудников', value: String(totalMembers), inline: true },
        { name: 'Суммарный балансовый фонд', value: `${totalBalance} ${config.currencyPlural}`, inline: true },
        { name: 'Город расположения', value: config.city, inline: true },
        { name: 'Классных чинов', value: String(RANKS.length), inline: true },
        { name: 'Должностей', value: String(POSITIONS.length), inline: true },
        { name: 'Режим управления', value: config.adminRoleId ? 'Роль-администратор задана' : 'Административный доступ по правам сервера', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (commandName === 'minjust-balance') {
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guildConfig = ensureGuildConfig(guild.id);

    if (sub === 'show') {
      const balance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const rank = guildConfig.memberRanks[targetUser.id] || 'Не назначен';
      const position = guildConfig.memberPositions[targetUser.id] || 'Не назначена';

      const embed = new EmbedBuilder()
        .setColor(botColor)
        .setTitle('Проверка баланса')
        .setDescription(`Оперативная сводка по сотруднику ${targetUser}`)
        .addFields(
          { name: 'Сотрудник', value: targetUser.tag, inline: true },
          { name: 'Классный чин', value: rank, inline: true },
          { name: 'Должность', value: position, inline: true },
          { name: 'Баланс', value: `${balance} ${guildConfig.currencyPlural}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'У вас нет полномочий для проведения ведомственных расчётов.', ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason') || 'Без указания основания';

    if (sub === 'add') {
      const previousBalance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const updated = adjustBalance(guild.id, targetUser.id, amount, { reason, updatedBy: interaction.user.id, lastUpdated: new Date().toISOString() });

      const embed = new EmbedBuilder()
        .setColor('#10B981')
        .setTitle('Выдано премиальное начисление')
        .setDescription(`Сотруднику ${targetUser} начислено ${amount} ${guildConfig.currencyPlural}.`)
        .addFields(
          { name: 'Основание', value: reason, inline: false },
          { name: 'Предыдущий баланс', value: `${previousBalance}`, inline: true },
          { name: 'Текущий баланс', value: `${updated.balance}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendToLogChannel(guild, `**Начисление:** ${interaction.user} выдал ${targetUser} ${amount} ${guildConfig.currencyPlural}. Основание: ${reason}.`, '#10B981');
      return;
    }

    if (sub === 'remove') {
      const previousBalance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const updated = adjustBalance(guild.id, targetUser.id, -amount, { reason, updatedBy: interaction.user.id, lastUpdated: new Date().toISOString() });

      const embed = new EmbedBuilder()
        .setColor('#D93B3B')
        .setTitle('Произведено удержание')
        .setDescription(`С сотрудника ${targetUser} удержано ${amount} ${guildConfig.currencyPlural}.`)
        .addFields(
          { name: 'Основание', value: reason, inline: false },
          { name: 'Предыдущий баланс', value: `${previousBalance}`, inline: true },
          { name: 'Текущий баланс', value: `${updated.balance}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendToLogChannel(guild, `**Удержание:** ${interaction.user} снял с ${targetUser} ${amount} ${guildConfig.currencyPlural}. Основание: ${reason}.`, '#D93B3B');
      return;
    }

    if (sub === 'set') {
      const previousBalance = getMemberBalance(guild.id, targetUser.id).balance || 0;
      const updated = setMemberBalance(guild.id, targetUser.id, amount, { reason, updatedBy: interaction.user.id, lastUpdated: new Date().toISOString() });

      const embed = new EmbedBuilder()
        .setColor('#F59E0B')
        .setTitle('Изменён служебный баланс')
        .setDescription(`Баланс ${targetUser} установлен в размере ${amount} ${guildConfig.currencyPlural}.`)
        .addFields(
          { name: 'Основание', value: reason, inline: false },
          { name: 'Предыдущий баланс', value: `${previousBalance}`, inline: true },
          { name: 'Текущий баланс', value: `${updated.balance}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendToLogChannel(guild, `**Корректировка баланса:** ${interaction.user} установил ${targetUser} баланс ${amount} ${guildConfig.currencyPlural}. Основание: ${reason}.`, '#F59E0B');
      return;
    }
  }

  if (commandName === 'minjust-rank') {
    const sub = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setColor(botColor)
        .setTitle('Классные чины Министерства юстиции')
        .setDescription(RANKS.map((rank, idx) => `${idx + 1}. ${rank}`).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'У текущего служащего недостаточно полномочий для назначения классных чинов.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    const rankName = interaction.options.getString('rank') || '';

    if (sub === 'assign') {
      if (!RANKS.includes(rankName)) {
        await interaction.reply({ content: 'Указанный чин не найден в реестре Министерства. Проверьте корректность наименования.', ephemeral: true });
        return;
      }

      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден в текущем сервере.', ephemeral: true });
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

    if (sub === 'clear') {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден в текущем сервере.', ephemeral: true });
        return;
      }

      const currentRank = guildConfig.memberRanks[targetUser.id];
      if (currentRank) {
        const role = guild.roles.cache.find(r => r.name === currentRank);
        if (role) await member.roles.remove(role).catch(() => {});
      }

      delete guildConfig.memberRanks[targetUser.id];
      saveGuildConfig(guild.id, guildConfig);

      await interaction.reply({ content: `Сотруднику ${targetUser} снят действующий чин.` });
      await sendToLogChannel(guild, `**Снятие чина:** ${interaction.user} снял с ${targetUser} текущий чин.`, '#D93B3B');
      return;
    }
  }

  if (commandName === 'minjust-position') {
    const sub = interaction.options.getSubcommand();
    const guildConfig = ensureGuildConfig(guild.id);

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setColor(botColor)
        .setTitle('Должности Министерства юстиции')
        .setDescription(POSITIONS.map((position, idx) => `${idx + 1}. ${position}`).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'У текущего служащего недостаточно полномочий для назначения должностей.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    const positionName = interaction.options.getString('position') || '';

    if (sub === 'assign') {
      if (!POSITIONS.includes(positionName)) {
        await interaction.reply({ content: 'Указанная должность отсутствует в реестре Министерства. Проверьте формулировку.', ephemeral: true });
        return;
      }

      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден в текущем сервере.', ephemeral: true });
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

    if (sub === 'clear') {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: 'Сотрудник не найден в текущем сервере.', ephemeral: true });
        return;
      }

      const currentPosition = guildConfig.memberPositions[targetUser.id];
      if (currentPosition) {
        const role = guild.roles.cache.find(r => r.name === currentPosition);
        if (role) await member.roles.remove(role).catch(() => {});
      }

      delete guildConfig.memberPositions[targetUser.id];
      saveGuildConfig(guild.id, guildConfig);

      await interaction.reply({ content: `Сотруднику ${targetUser} снята действующая должность.` });
      await sendToLogChannel(guild, `**Снятие должности:** ${interaction.user} снял с ${targetUser} должность.`, '#D93B3B');
      return;
    }
  }

  if (commandName === 'minjust-config') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const config = ensureGuildConfig(guild.id);
      const embed = new EmbedBuilder()
        .setColor(botColor)
        .setTitle('Настройки ведомства')
        .addFields(
          { name: 'Название', value: config.name, inline: true },
          { name: 'Город', value: config.city, inline: true },
          { name: 'Валюта', value: config.currency, inline: true },
          { name: 'Цвет', value: config.color, inline: true },
          { name: 'Канал приветствий', value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Не задан', inline: true },
          { name: 'Канал логов', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Не задан', inline: true },
          { name: 'Роль администратора', value: config.adminRoleId ? `<@&${config.adminRoleId}>` : 'Не задана', inline: true },
          { name: 'Подпись', value: config.footerText || 'Отсутствует', inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!hasAdminAccess(interaction.member)) {
      await interaction.reply({ content: 'У текущего служащего недостаточно полномочий для изменения настроек ведомства.', ephemeral: true });
      return;
    }

    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');
    const config = ensureGuildConfig(guild.id);

    if (key === 'welcomeChannel' || key === 'logChannel' || key === 'adminRole') {
      const target = value.replace(/[<>#&]/g, '').trim();
      if (key === 'welcomeChannel') config.welcomeChannelId = target;
      if (key === 'logChannel') config.logChannelId = target;
      if (key === 'adminRole') config.adminRoleId = target;
    } else {
      config[key] = value;
    }

    if (key === 'name') config.name = value;
    if (key === 'city') config.city = value;
    if (key === 'currency') {
      config.currency = value;
      config.currencyPlural = `${value}ов`;
    }
    if (key === 'color') config.color = value;
    if (key === 'welcomeMessage') config.welcomeMessage = value;
    if (key === 'footerText') config.footerText = value;

    saveGuildConfig(guild.id, config);
    await interaction.reply({ content: `Параметр **${key}** обновлён.` });
    await sendToLogChannel(guild, `**Изменение настроек ведомства:** ${interaction.user} обновил параметр **${key}**.`, '#1F6FEB');
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);

module.exports = {
  client,
  RANKS,
  POSITIONS,
  DEPARTMENTS,
  hasAdminAccess,
  ensureRole
};

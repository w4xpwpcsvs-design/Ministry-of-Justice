const { REST, Routes } = require('discord.js');
const { config } = require('dotenv');
const { getSlashCommands } = require('./commands');

config();

const registerSlashCommands = async ({
  token = process.env.DISCORD_TOKEN,
  clientId = process.env.CLIENT_ID,
  guildId = process.env.GUILD_ID
} = {}) => {
  if (!token || !clientId) {
    console.warn('Пропуск регистрации slash-команд: DISCORD_TOKEN или CLIENT_ID не заполнены.');
    return false;
  }

  const rest = new REST({ version: '10' }).setToken(token);
  const commands = getSlashCommands().map((command) => command.toJSON());

  try {
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

    await rest.put(route, { body: commands });

    if (guildId) {
      console.log('Slash-команды успешно зарегистрированы для текущего сервера.');
    } else {
      console.log('Slash-к��манды успешно зарегистрированы глобально.');
    }

    return true;
  } catch (error) {
    console.error('Ошибка регистрации slash-команд:', error);
    return false;
  }
};

if (require.main === module) {
  registerSlashCommands();
}

module.exports = {
  registerSlashCommands
};

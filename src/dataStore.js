const { REST, Routes } = require('discord.js');
const { config } = require('dotenv');
const { getSlashCommands } = require('./commands');

config();

const commands = getSlashCommands();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');

(async () => {
  try {
    console.log('Регистрация команд Минюста...');

    const guildId = process.env.GUILD_ID;
    const clientId = process.env.CLIENT_ID;

    if (!clientId || !process.env.DISCORD_TOKEN) {
      throw new Error('Не заданы DISCORD_TOKEN или CLIENT_ID. Проверьте .env');
    }

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands
      });
      console.log('Команды зарегистрированы только для текущего сервера.');
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands
      });
      console.log('Команды зарегистрированы глобально.');
    }
  } catch (error) {
    console.error('Ошибка регистрации команд:', error);
  }
})();


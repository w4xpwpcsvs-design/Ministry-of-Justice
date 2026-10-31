const { SlashCommandBuilder } = require('discord.js');

const RANKS = [
  'Юрист 3 класса',
  'Юрист 2 класса',
  'Юрист 1 класса',
  'Советник юстиции 3 класса',
  'Советник юстиции 2 класса',
  'Советник юстиции 1 класса',
  'Государственный советник юстиции Российской Федерации 3 класса',
  'Государственный советник юстиции Российской Федерации 2 класса',
  'Государственный советник юстиции Российской Федерации 1 класса',
  'Действительный государственный советник юстиции Российской Федерации 3 класса',
  'Действительный государственный советник юстиции Российской Федерации 2 класса',
  'Действительный государственный советник юстиции Российской Федерации 1 класса',
  'Действительный государственный советник юстиции Российской Федерации'
];

const POSITIONS = [
  'Специалист 2 разряда',
  'Специалист 1 разряда',
  'Специалист-эксперт',
  'Ведущий специалист-эксперт',
  'Главный специалист-эксперт',
  'Консультант',
  'Помощник Министра юстиции РФ',
  'Советник',
  'Заместитель начальника отдела',
  'Начальник отдела',
  'Заместитель директора департамента',
  'Директор департамента',
  'Заместитель Министра юстиции РФ',
  'Статс-секретарь — заместитель Министра юстиции РФ',
  'Первый заместитель Министра юстиции РФ',
  'Министр юстиции РФ'
];

const DEPARTMENTS = [
  'Министерство юстиции Российской Федерации',
  'Аппарат Министра юстиции Российской Федерации',
  'Правовой департамент',
  'Департамент международного права и сотрудничества',
  'Департамент уголовно-правовой политики',
  'Департамент исполнения и контроля',
  'Департамент государственной регистрации и правовой экспертизы',
  'Департамент правовой защиты и судебной поддержки',
  'Департамент кадровой политики и аттестации',
  'Юридическая служба федеральных органов исполнительной власти',
  'Управление делами и документооборота',
  'Отдел внутреннего аудита и служебной проверки'
];

const getSlashCommands = () => [
  new SlashCommandBuilder()
    .setName('minjust-help')
    .setDescription('Справка по структуре и служебным командам Министерства'),

  new SlashCommandBuilder()
    .setName('minjust-structure')
    .setDescription('Структура ведомства и основные подразделения')
    .addSubcommand(sub => sub.setName('list').setDescription('Показать структуру ведомства')),

  new SlashCommandBuilder()
    .setName('minjust-profile')
    .setDescription('Показать служебную карточку сотрудника')
    .addUserOption(option =>
      option.setName('user').setDescription('Сотрудник').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('minjust-status')
    .setDescription('Сводка по ведомству и статистике'),

  new SlashCommandBuilder()
    .setName('minjust-balance')
    .setDescription('Управление балансовой системой Министерства')
    .addSubcommand(sub =>
      sub
        .setName('show')
        .setDescription('Показать баланс участника')
        .addUserOption(option =>
          option.setName('user').setDescription('Участник').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Выдать баллы участнику')
        .addUserOption(option =>
          option.setName('user').setDescription('Участник').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true).setMinValue(1)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Основание').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Снять баллы с участника')
        .addUserOption(option =>
          option.setName('user').setDescription('Участник').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true).setMinValue(1)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Основание').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Установить точный баланс участника')
        .addUserOption(option =>
          option.setName('user').setDescription('Участник').setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount').setDescription('Количество баллов').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason').setDescription('Основание').setRequired(false)
        )
    ),

  new SlashCommandBuilder()
    .setName('minjust-rank')
    .setDescription('Управление классными чинами')
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Показать список классных чинов')
    )
    .addSubcommand(sub =>
      sub
        .setName('assign')
        .setDescription('Назначить классный чин сотруднику')
        .addUserOption(option =>
          option.setName('user').setDescription('Сотрудник').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('rank').setDescription('Наименование чина').setRequired(true)
          .setAutocomplete(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('clear')
        .setDescription('Снять классный чин с сотрудника')
        .addUserOption(option =>
          option.setName('user').setDescription('Сотрудник').setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('minjust-position')
    .setDescription('Управление должностями')
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Показать список должностей')
    )
    .addSubcommand(sub =>
      sub
        .setName('assign')
        .setDescription('Назначить должность сотруднику')
        .addUserOption(option =>
          option.setName('user').setDescription('Сотрудник').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('position').setDescription('Наименование должности').setRequired(true)
          .setAutocomplete(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('clear')
        .setDescription('Снять должность с сотрудника')
        .addUserOption(option =>
          option.setName('user').setDescription('Сотрудник').setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('minjust-config')
    .setDescription('Настройки Министерства')
    .addSubcommand(sub => sub.setName('view').setDescription('Показать текущие настройки'))
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Изменить настройку сервера')
        .addStringOption(option =>
          option
            .setName('key')
            .setDescription('Параметр')
            .setRequired(true)
            .addChoices(
              { name: 'name', value: 'name' },
              { name: 'city', value: 'city' },
              { name: 'currency', value: 'currency' },
              { name: 'color', value: 'color' },
              { name: 'welcome-message', value: 'welcomeMessage' },
              { name: 'welcome-channel', value: 'welcomeChannel' },
              { name: 'log-channel', value: 'logChannel' },
              { name: 'admin-role', value: 'adminRole' },
              { name: 'footer-text', value: 'footerText' }
            )
        )
        .addStringOption(option =>
          option.setName('value').setDescription('Новое значение').setRequired(true)
        )
    )
];

module.exports = {
  RANKS,
  POSITIONS,
  DEPARTMENTS,
  getSlashCommands
};

















































































































































































































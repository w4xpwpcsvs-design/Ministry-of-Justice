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
    .setDescription('Служебная справка Минюста')
    .addStringOption(option =>
      option
        .setName('topic')
        .setDescription('Раздел справки')
        .setRequired(false)
        .addChoices(
          { name: 'overview', value: 'overview' },
          { name: 'commands', value: 'commands' },
          { name: 'structure', value: 'structure' },
          { name: 'ranks', value: 'ranks' },
          { name: 'positions', value: 'positions' }
        )
    ),

  new SlashCommandBuilder()
    .setName('minjust-structure')
    .setDescription('Структура ведомства и подразделения'),

  new SlashCommandBuilder()
    .setName('minjust-profile')
    .setDescription('Показать служебную карточку сотрудника')
    .addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(false)),

  new SlashCommandBuilder()
    .setName('minjust-status')
    .setDescription('Сводка по ведомству и статистике'),

  new SlashCommandBuilder()
    .setName('minjust-balance')
    .setDescription('Балансовая система Министерства')
    .addSubcommand(sub => sub.setName('show').setDescription('Показать баланс').addUserOption(option => option.setName('user').setDescription('Участник').setRequired(false)))
    .addSubcommand(sub => sub.setName('add').setDescription('Выдать баллы').addUserOption(option => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption(option => option.setName('amount').setDescription('Количество').setRequired(true).setMinValue(1)).addStringOption(option => option.setName('reason').setDescription('Основание').setRequired(false)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Снять баллы').addUserOption(option => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption(option => option.setName('amount').setDescription('Количество').setRequired(true).setMinValue(1)).addStringOption(option => option.setName('reason').setDescription('Основание').setRequired(false)))
    .addSubcommand(sub => sub.setName('set').setDescription('Установить точный баланс').addUserOption(option => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption(option => option.setName('amount').setDescription('Количество').setRequired(true)).addStringOption(option => option.setName('reason').setDescription('Основание').setRequired(false))),

  new SlashCommandBuilder()
    .setName('minjust-rank')
    .setDescription('Классные чины Минюста')
    .addSubcommand(sub => sub.setName('list').setDescription('Список чинов'))
    .addSubcommand(sub => sub.setName('assign').setDescription('Назначить чин').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption(option => option.setName('rank').setDescription('Чин').setRequired(true).setAutocomplete(true)))
    .addSubcommand(sub => sub.setName('clear').setDescription('Снять чин').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('minjust-position')
    .setDescription('Должности в ведомстве')
    .addSubcommand(sub => sub.setName('list').setDescription('Список должностей'))
    .addSubcommand(sub => sub.setName('assign').setDescription('Назначить должность').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption(option => option.setName('position').setDescription('Должность').setRequired(true).setAutocomplete(true)))
    .addSubcommand(sub => sub.setName('clear').setDescription('Снять должность').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('minjust-department')
    .setDescription('Подразделения ведомства')
    .addSubcommand(sub => sub.setName('list').setDescription('Список подразделений'))
    .addSubcommand(sub => sub.setName('assign').setDescription('Назначить подразделение').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption(option => option.setName('department').setDescription('Подразделение').setRequired(true).setAutocomplete(true)))
    .addSubcommand(sub => sub.setName('clear').setDescription('Снять подразделение').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('minjust-order')
    .setDescription('Приказы и распоряжения')
    .addSubcommand(sub => sub.setName('list').setDescription('Показать приказы'))
    .addSubcommand(sub => sub.setName('add').setDescription('Добавить приказ').addStringOption(option => option.setName('title').setDescription('Заголовок приказа').setRequired(true)).addStringOption(option => option.setName('text').setDescription('Содержание приказа').setRequired(true)))
    .addSubcommand(sub => sub.setName('clear').setDescription('Очистить приказной журнал')), 

  new SlashCommandBuilder()
    .setName('minjust-disciplinary')
    .setDescription('Дисциплинарные меры и взыскания')
    .addSubcommand(sub => sub.setName('list').setDescription('Показать дисциплинарные записи'))
    .addSubcommand(sub => sub.setName('add').setDescription('Добавить взыскание').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption(option => option.setName('type').setDescription('Тип взыскания').setRequired(true).addChoices({ name: 'Устное предупреждение', value: 'Устное предупреждение' }, { name: 'Письменное предупреждение', value: 'Письменное предупреждение' }, { name: 'Временное ограничение прав', value: 'Временное ограничение прав' }, { name: 'Дисциплинарное взыскание', value: 'Дисциплинарное взыскание' })).addStringOption(option => option.setName('reason').setDescription('Основание').setRequired(true)))
    .addSubcommand(sub => sub.setName('clear').setDescription('Очистить дисциплинарную запись').addUserOption(option => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('minjust-config')
    .setDescription('Настройки ведомства')
    .addSubcommand(sub => sub.setName('view').setDescription('Показать настройки'))
    .addSubcommand(sub => sub.setName('set').setDescription('Изменить параметр').addStringOption(option => option.setName('key').setDescription('Параметр').setRequired(true).addChoices({ name: 'name', value: 'name' }, { name: 'city', value: 'city' }, { name: 'currency', value: 'currency' }, { name: 'color', value: 'color' }, { name: 'welcome-message', value: 'welcomeMessage' }, { name: 'welcome-channel', value: 'welcomeChannel' }, { name: 'log-channel', value: 'logChannel' }, { name: 'admin-role', value: 'adminRole' }, { name: 'footer-text', value: 'footerText' })).addStringOption(option => option.setName('value').setDescription('Новое значение').setRequired(true)))
];

module.exports = {
  RANKS,
  POSITIONS,
  DEPARTMENTS,
  getSlashCommands
};


























































































































































































































































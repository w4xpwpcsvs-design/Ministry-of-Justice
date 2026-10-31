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

const DEPARTMENT_INFO = {
  'Министерство юстиции Российской Федерации': 'Высший государственный орган, осуществляющий правовое регулирование и координацию в сфере законности и правоприменения.',
  'Аппарат Министра юстиции Российской Федерации': 'Обеспечивает работу министра, координацию управления, организацию служебных мероприятий и взаимодействие с руководством.',
  'Правовой департамент': 'Отвечает за анализ законодательства, подготовку правовых актов, правовое сопровождение нормативной деятельности и систематизацию правовых решений.',
  'Департамент международного права и сотрудничества': 'Способствует развитию международных правовых связей, правовому взаимодействию с иностранными партнёрами и анализу внешнеправовых вопросов.',
  'Департамент уголовно-правовой политики': 'Проводит правовую экспертизу уголовной политики, разрабатывает мероприятия по укреплению правопорядка и законности.',
  'Департамент исполнения и контроля': 'Следит за исполнением правовых решений, служебной дисциплиной, контролем соблюдения регламентов и реализации госмоделей.',
  'Департамент государственной регистрации и правовой экспертизы': 'Отвечает за регистрацию, проверку документов, правовую экспертизу и подтверждение законности действий государственных структур.',
  'Департамент правовой защиты и судебной поддержки': 'Обеспечивает правовое сопровождение судебных и межведомственных процессов, защиту интересов ведомства и сопровождение споров.',
  'Департамент кадровой политики и аттестации': 'Управляет служебным составом, аттестацией, назначениями, повышением квалификации и кадровым учетом.',
  'Юридическая служба федеральных органов исполнительной власти': 'Служит правовой опорой для органов власти, обеспечивает юридическую поддержку исполнения федеральных задач и законодательных функций.',
  'Управление делами и документооборота': 'Контролирует служебную документацию, архивный оборот, делопроизводство и официальный документооборот ведомства.',
  'Отдел внутреннего аудита и служебной проверки': 'Проводит служебный аудит, проверяет соблюдение norme, осуществляет внутренние проверки и анализ эффективности деятельности.'
};

const getSlashCommands = () => [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Служебная справка Министерства юстиции')
    .addStringOption((option) =>
      option
        .setName('topic')
        .setDescription('Раздел справки')
        .setRequired(false)
        .addChoices(
          { name: 'overview', value: 'overview' },
          { name: 'structure', value: 'structure' },
          { name: 'ranks', value: 'ranks' },
          { name: 'positions', value: 'positions' },
          { name: 'departments', value: 'departments' },
          { name: 'commands', value: 'commands' }
        )
    ),

  new SlashCommandBuilder()
    .setName('structure')
    .setDescription('Структура ведомства и подразделений'),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Показать служебную карточку сотрудника')
    .addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(false)),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Сводка по ведомству и статистике'),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Балансовая система Министерства')
    .addSubcommand((sub) => sub.setName('show').setDescription('Показать баланс').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(false)))
    .addSubcommand((sub) => sub.setName('add').setDescription('Выдать баллы').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption((option) => option.setName('amount').setDescription('Сумма').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(false)))
    .addSubcommand((sub) => sub.setName('remove').setDescription('Снять баллы').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption((option) => option.setName('amount').setDescription('Сумма').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(false)))
    .addSubcommand((sub) => sub.setName('set').setDescription('Установить точный баланс').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption((option) => option.setName('amount').setDescription('Сумма').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(false))),

  new SlashCommandBuilder()
    .setName('access')
    .setDescription('Управление служебными правами в системе Министерства')
    .addSubcommand((sub) =>
      sub
        .setName('assign')
        .setDescription('Назначить служебный доступ')
        .addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))
        .addStringOption((option) =>
          option
            .setName('role')
            .setDescription('Роль доступа')
            .setRequired(true)
            .addChoices(
              { name: 'owner', value: 'owner' },
              { name: 'minister', value: 'minister' },
              { name: 'leadership', value: 'leadership' },
              { name: 'department_admin', value: 'department_admin' },
              { name: 'staff', value: 'staff' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('revoke')
        .setDescription('Снять служебный доступ')
        .addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Показать список служебных прав')),

  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Классные чины Минюста')
    .addSubcommand((sub) => sub.setName('list').setDescription('Список чинов'))
    .addSubcommand((sub) => sub.setName('assign').setDescription('Назначить чин').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('rank').setDescription('Чин').setRequired(true).addChoices(...RANKS.map((rank) => ({ name: rank, value: rank })))) )
    .addSubcommand((sub) => sub.setName('clear').setDescription('Снять чин').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('position')
    .setDescription('Должности в ведомстве')
    .addSubcommand((sub) => sub.setName('list').setDescription('Список должностей'))
    .addSubcommand((sub) => sub.setName('assign').setDescription('Назначить должность').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('position').setDescription('Должность').setRequired(true).addChoices(...POSITIONS.map((position) => ({ name: position, value: position })))) )
    .addSubcommand((sub) => sub.setName('clear').setDescription('Снять должность').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('department')
    .setDescription('Подразделения ведомства')
    .addSubcommand((sub) => sub.setName('list').setDescription('Список подразделений'))
    .addSubcommand((sub) => sub.setName('assign').setDescription('Назначить подразделение').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('department').setDescription('Подразделение').setRequired(true).addChoices(...DEPARTMENTS.map((department) => ({ name: department, value: department })))) )
    .addSubcommand((sub) => sub.setName('clear').setDescription('Снять подразделение').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('order')
    .setDescription('Приказы и распоряжения')
    .addSubcommand((sub) => sub.setName('list').setDescription('Показать приказы'))
    .addSubcommand((sub) => sub.setName('add').setDescription('Добавить приказ').addStringOption((option) => option.setName('title').setDescription('Заголовок приказа').setRequired(true)).addStringOption((option) => option.setName('text').setDescription('Текст приказа').setRequired(true)))
    .addSubcommand((sub) => sub.setName('clear').setDescription('Очистить приказной журнал')),

  new SlashCommandBuilder()
    .setName('disciplinary')
    .setDescription('Дисциплинарные меры и взыскания')
    .addSubcommand((sub) => sub.setName('list').setDescription('Показать дисциплинарные записи'))
    .addSubcommand((sub) => sub.setName('add').setDescription('Добавить взыскание').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('type').setDescription('Тип записи').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(true)))
    .addSubcommand((sub) => sub.setName('clear').setDescription('Очистить дисциплинарную запись').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Настройки ведомства')
    .addSubcommand((sub) => sub.setName('view').setDescription('Показать настройки'))
    .addSubcommand((sub) => sub.setName('set').setDescription('Изменить параметр').addStringOption((option) => option.setName('key').setDescription('Параметр').setRequired(true)).addStringOption((option) => option.setName('value').setDescription('Значение').setRequired(true)))
];

module.exports = {
  RANKS,
  POSITIONS,
  DEPARTMENTS,
  DEPARTMENT_INFO,
  getSlashCommands
};

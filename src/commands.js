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
  'Министерство юстиции Российской Федерации': 'Высший федеральный орган исполнительной власти, обеспечивающий реализацию государственной правовой политики и защиту законности.',
  'Аппарат Министра юстиции Российской Федерации': 'Осуществляет организационное, аналитическое и служебное обеспечение деятельности министра и руководства ведомства.',
  'Правовой департамент': 'Отвечает за правовое сопровождение государственной деятельности, подготовку нормативно-правовой базы и правовую экспертизу.',
  'Департамент международного права и сотрудничества': 'Способствует развитию международного правового сотрудничества и правовому обеспечению внешнеполитических инициатив.',
  'Департамент уголовно-правовой политики': 'Формирует правовые подходы в сфере уголовной политики, анализа законодательства и правовой модели реагирования.',
  'Департамент исполнения и контроля': 'Следит за исполнением служебных решений, соблюдением регламентов, организационной дисциплины и надзора за выполнением задач.',
  'Департамент государственной регистрации и правовой экспертизы': 'Проводит регистрацию, правовую проверку и экспертизу документов, обращений и служебной документации.',
  'Департамент правовой защиты и судебной поддержки': 'Обеспечивает юридическое сопровождение судебных, административных и правоприменительных процессов.',
  'Департамент кадровой политики и аттестации': 'Отвечает за кадровое обеспечение, аттестацию, подбор сотрудников и служебное развитие персонала.',
  'Юридическая служба федеральных органов исполнительной власти': 'Оказывает правовую поддержку федеральным органам и обеспечивает согласованность правовых решений.',
  'Управление делами и документооборота': 'Контролирует служебную документацию, делопроизводство, архивные процессы и порядок документооборота.',
  'Отдел внутреннего аудита и служебной проверки': 'Проводит внутренние проверки, аудит служебной деятельности и анализ соблюдения нормативных требований.'
};

const helpOverviewText = `Министерство юстиции Российской Федерации

Министерство юстиции Российской Федерации является федеральным органом исполнительной власти, обеспечивающим реализацию государственной правовой политики и защиту законности.

Основные задачи ведомства:
- формирование и реализация государственной правовой политики;
- обеспечение законности и правовой дисциплины в системе публичного управления;
- правовое сопровождение деятельности федеральных органов исполнительной власти;
- проведение правовой экспертизы и координация нормативно-правовой работы;
- контроль за исполнением правовых актов и соблюдением служебной дисциплины;
- поддержка судебной, правоохранительной и административной деятельности;
- государственная регистрация, правовой анализ и организационное сопровождение процессов;
- кадровое обеспечение и управление служебным составом ведомства.

Структура ведомства включает:
- Аппарат Министра;
- Правовой департамент;
- Департамент международного права и сотрудничества;
- Департамент уголовно-правовой политики;
- Департамент исполнения и контроля;
- Департамент государственной регистрации и правовой экспертизы;
- Департамент правовой защиты и судебной поддержки;
- Департамент кадровой политики и аттестации;
- Юридическую службу федеральных органов исполнительной власти;
- Управление делами и документооборота;
- Отдел внутреннего аудита и служебной проверки.

Реальные чины:
- Юрист 3 класса
- Юрист 2 класса
- Юрист 1 класса
- Советник юстиции 3 класса
- Советник юстиции 2 класса
- Советник юстиции 1 класса
- Государственный советник юстиции РФ 3 класса
- Государственный советник юстиции РФ 2 класса
- Государственный советник юстиции РФ 1 класса
- Действительный государственный советник юстиции РФ 3 класса
- Действительный государственный советник юстиции РФ 2 класса
- Действительный государственный советник юстиции РФ 1 класса
- Действительный государственный советник юстиции РФ

Реальные должности:
- Специалист 2 разряда
- Специалист 1 разряда
- Специалист-эксперт
- Ведущий специалист-эксперт
- Главный специалист-эксперт
- Консультант
- Помощник Министра юстиции РФ
- Советник
- Заместитель начальника отдела
- Начальник отдела
- Заместитель директора департамента
- Директор департамента
- Заместитель Министра юстиции РФ
- Статс-секретарь — заместитель Министра юстиции РФ
- Первый заместитель Министра юстиции РФ
- Министр юстиции РФ

Бот Министерства юстиции предназначен для:
- ведения служебной карточки сотрудников;
- расчёта и контроля балансовой системы;
- назначения и снятия классных чинов;
- назначения и снятия должностей;
- фиксации служебного подразделения сотрудников;
- ведения приказного журнала и служебных распоряжений;
- учёта дисциплинарных мер и взысканий;
- формирования сводной статистики ведомства;
- обеспечения служебной справки и структуры Минюста;
- поддержки административного управления системой.

Для получения подробной информации используйте:
- /help overview
- /help structure
- /help commands
- /help ranks
- /help positions
- /help departments

Или воспользуйтесь служебными командами бота:
- /help
- /structure
- /profile
- /status
- /rank
- /position
- /department
- /balance
- /disciplinary`;

const helpStructureText = `Структура Министерства юстиции Российской Федерации

Министерство юстиции является центральным органом федеральной исполнительной власти, обеспечивающим реализацию правовой политики и соблюдение законности в сфере государственного управления.

Основные направления деятельности:
- правовое регулирование и государственная политика в сфере юстиции;
- правовое сопровождение федеральных органов исполнительной власти;
- организация и контроль служебной дисциплины;
- поддержка органов власти в вопросах законности и правоприменения;
- кадровое, административное и правовое управление ведомством.

Подразделения:
- Аппарат Министра — организационное и управленческое обеспечение деятельности министра и руководства.
- Правовой департамент — правовое сопровождение государственной деятельности и нормативно-правовая работа.
- Департамент международного права и сотрудничества — международное правовое взаимодействие и внешнеполитические вопросы.
- Департамент уголовно-правовой политики — работа в сфере уголовной политики, правового анализа и правоприменения.
- Департамент исполнения и контроля — контроль исполнения решений, дисциплины и регламентов.
- Департамент государственной регистрации и правовой экспертизы — регистрационная и экспертная деятельность.
- Департамент правовой защиты и судебной поддержки — сопровождение судебных и правовых процессов.
- Департамент кадровой политики и аттестации — служебный состав, аттестация и развитие кадров.
- Юридическая служба федеральных органов исполнительной власти — правовое сопровождение межведомственных и государственных задач.
- Управление делами и документооборота — служебное делопроизводство и документный оборот.
- Отдел внутреннего аудита и служебной проверки — аудит, проверки и анализ соблюдения норм.

Министерство действует в целях обеспечения законности, правовой системы и устойчивого государственного управления.`;

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
    .addSubcommand((sub) => sub.setName('add').setDescription('Выдать баллы').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption((option) => option.setName('amount').setDescription('Количество').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(false)))
    .addSubcommand((sub) => sub.setName('remove').setDescription('Снять баллы').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption((option) => option.setName('amount').setDescription('Количество').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(false)))
    .addSubcommand((sub) => sub.setName('set').setDescription('Установить точный баланс').addUserOption((option) => option.setName('user').setDescription('Участник').setRequired(true)).addIntegerOption((option) => option.setName('amount').setDescription('Количество').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(false))),

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
    .addSubcommand((sub) => sub.setName('assign').setDescription('Назначить чин').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('rank').setDescription('Чин').setRequired(true).addChoices(...RANKS.map((name) => ({ name, value: name })))) )
    .addSubcommand((sub) => sub.setName('clear').setDescription('Снять чин').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('position')
    .setDescription('Должности в ведомстве')
    .addSubcommand((sub) => sub.setName('list').setDescription('Список должностей'))
    .addSubcommand((sub) => sub.setName('assign').setDescription('Назначить должность').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('position').setDescription('Должность').setRequired(true).addChoices(...POSITIONS.map((name) => ({ name, value: name })))) )
    .addSubcommand((sub) => sub.setName('clear').setDescription('Снять должность').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true))),

  new SlashCommandBuilder()
    .setName('department')
    .setDescription('Подразделения ведомства')
    .addSubcommand((sub) => sub.setName('list').setDescription('Список подразделений'))
    .addSubcommand((sub) => sub.setName('assign').setDescription('Назначить подразделение').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('department').setDescription('Подразделение').setRequired(true).addChoices(...DEPARTMENTS.map((name) => ({ name, value: name })))) )
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
    .addSubcommand((sub) => sub.setName('add').setDescription('Добавить взыскание').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)).addStringOption((option) => option.setName('type').setDescription('Тип нарушения').setRequired(true)).addStringOption((option) => option.setName('reason').setDescription('Основание').setRequired(true)))
    .addSubcommand((sub) => sub.setName('clear').setDescription('Очистить дисциплинарную запись').addUserOption((option) => option.setName('user').setDescription('Сотрудник').setRequired(true)))
];

module.exports = {
  RANKS,
  POSITIONS,
  DEPARTMENTS,
  DEPARTMENT_INFO,
  helpOverviewText,
  helpStructureText,
  getSlashCommands
};

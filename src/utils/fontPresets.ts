export interface FontPreset {
  id: string;
  name: string;
  category: 'Геометрические' | 'Интерфейсные' | 'Мягкие и скругленные' | 'Классические и деловые';
  fontFamily: string;
  monoFamily?: string;
  description: string;
  popularFor: string;
  sample: string;
  author: string;
}

export type FontWeightLevel = 'light' | 'normal' | 'medium' | 'bold';

export const AVAILABLE_FONTS: FontPreset[] = [
  {
    id: 'montserrat',
    name: 'Montserrat (По умолчанию)',
    category: 'Геометрические',
    fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
    description: 'Современный, уверенный и четкий геометрический шрифт. Идеальный баланс эстетики и читаемости.',
    popularFor: 'Брендинг, презентации, фармацевтические дашборды',
    sample: 'ООО «СИФАТ ФАРМА» • Душанбе, Таджикистан 2026',
    author: 'Julieta Ulanovsky'
  },
  {
    id: 'mulish',
    name: 'Mulish (Muli)',
    category: 'Геометрические',
    fontFamily: "'Mulish', 'Muli', sans-serif",
    description: 'Универсальный минималистичный гуманистический гротеск от Vernon Adams. Мягкий и приятный для глаз.',
    popularFor: 'Медицинские и фармацевтические сервисы, европейские стартапы',
    sample: '14 850,00 с. • Партия LOT-2026-NZV • Годен до 12.2028',
    author: 'Vernon Adams'
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'Интерфейсные',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    description: 'Мировой стандарт интерфейсной типографики от Rasmus Andersson. Идеальная микро-читаемость.',
    popularFor: 'Figma, GitHub, Stripe, корпоративные ERP-системы',
    sample: '44 121 384,53 с. • Склад №1 • Товарные запасы 100%',
    author: 'Rasmus Andersson'
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Геометрические',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    description: 'Премиальный, свежий и утонченный геометрический шрифт с безупречными пропорциями.',
    popularFor: 'FinTech, SaaS-платформы, премиальные дашборды',
    sample: '1 484 056,53 с. • Зона риска FEFO (Cat C, D)',
    author: 'Tokotype'
  },
  {
    id: 'onest',
    name: 'Onest',
    category: 'Интерфейсные',
    fontFamily: "'Onest', sans-serif",
    description: 'Специализированный экранный шрифт с потрясающей чистотой кириллицы и ровным ритмом чтения.',
    popularFor: 'Цифровые государственные порталы, банки, базы данных',
    sample: '2 011 134,91 с. • Карантин (Cat E) • 5 494 партий',
    author: 'Dmitry Rastvortsev'
  },
  {
    id: 'manrope',
    name: 'Manrope',
    category: 'Интерфейсные',
    fontFamily: "'Manrope', sans-serif",
    description: 'Современный неогротеск с полузакрытыми апертурами и ясной геометрией цифр.',
    popularFor: 'Швейцарский дизайн, аналитические дашборды, каталоги',
    sample: '88 754 526,30 с. • Торговая наценка +101.2%',
    author: 'Mikhail Sharanda'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    category: 'Мягкие и скругленные',
    fontFamily: "'Nunito', sans-serif",
    description: 'Очень мягкий, доброжелательный шрифт со слегка скругленными окончаниями штрихов. Не утомляет глаза.',
    popularFor: 'Клиентские приложения, забота о клиентах, здоровье',
    sample: '85 259 334,87 с. • Ликвидная норма (Cat A, B)',
    author: 'Vernon Adams & Jacques Le Bailly'
  },
  {
    id: 'rubik',
    name: 'Rubik',
    category: 'Мягкие и скругленные',
    fontFamily: "'Rubik', sans-serif",
    description: 'Шрифт с мягкими скругленными углами от Hubert & Fischer. Высокая плотность и комфорт.',
    popularFor: 'Google Maps, Waze, мобильные интерфейсы',
    sample: '9 550,00 с. • Срок 1–3 мес • Приоритет продаж',
    author: 'Hubert & Fischer'
  },
  {
    id: 'golos',
    name: 'Golos Text',
    category: 'Классические и деловые',
    fontFamily: "'Golos Text', sans-serif",
    description: 'Разработан специально для комфортного чтения больших массивов данных и документов.',
    popularFor: 'Аптечные реестры, накладные 1С, протоколы ISO/GMP',
    sample: 'Акт списания №15 • Провизор-инспектор • СМК ISO 9001',
    author: 'Paratype'
  },
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Геометрические',
    fontFamily: "'Outfit', sans-serif",
    description: 'Один из самых трендовых и красивых геометрических шрифтов. Идеален для цифр и графиков.',
    popularFor: 'AI-интерфейсы, крипто-кошельки, статистика нового поколения',
    sample: '3 938 957 упаковок • 41 537 серий в наличии',
    author: 'Rodrigo Fuenzalida'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    category: 'Классические и деловые',
    fontFamily: "'Open Sans', sans-serif",
    description: 'Проверенный временем нейтральный корпоративный шрифт от Стива Мэттисона.',
    popularFor: 'Корпоративные сайты, техническая документация',
    sample: 'Амоксициллин 500мг №20 • Цефтриаксон 1.0г',
    author: 'Steve Matteson'
  },
  {
    id: 'fira-sans',
    name: 'Fira Sans',
    category: 'Классические и деловые',
    fontFamily: "'Fira Sans', sans-serif",
    description: 'Шрифт от Mozilla и Эрика Шпикерманна с четким техническим и фармакологическим характером.',
    popularFor: 'Научные базы, лабораторные системы, аптечный учет',
    sample: 'Серия: LOT-2024-CFT-9901 • Фармконтроль пройден',
    author: 'Erik Spiekermann'
  },
  {
    id: 'comfortaa',
    name: 'Comfortaa',
    category: 'Мягкие и скругленные',
    fontFamily: "'Comfortaa', cursive, sans-serif",
    description: 'Ультра-плавный скругленный дизайнерский шрифт для максимально легкого визуального восприятия.',
    popularFor: 'Дизайн-студии, косметика, эко-продукты',
    sample: '52 430 упаковок спасено по регламенту FEFO',
    author: 'Johan Aakerlund'
  }
];

export const NUMBER_FONT_PRESETS = [
  { id: 'outfit', name: 'Outfit (Мягкие округлые цифры)', family: "'Outfit', sans-serif" },
  { id: 'mulish', name: 'Mulish (Сбалансированные цифры)', family: "'Mulish', sans-serif" },
  { id: 'inter', name: 'Inter (Табличные четкие цифры)', family: "'Inter', sans-serif" },
  { id: 'rubik', name: 'Rubik (Скругленные плотные цифры)', family: "'Rubik', sans-serif" },
  { id: 'onest', name: 'Onest (Современные экранные цифры)', family: "'Onest', sans-serif" },
  { id: 'plus-jakarta', name: 'Plus Jakarta (Премиальные цифры)', family: "'Plus Jakarta Sans', sans-serif" },
];

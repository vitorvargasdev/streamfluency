export enum DATE_FILTERS {
  ALL = 'all',
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}

export enum SORT_OPTIONS {
  RECENT = 'recent',
  ALPHABETICAL = 'alphabetical',
}

export const TIME_PERIODS = {
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const

export const UI_CONFIG = {
  MAX_VIDEO_TITLE_LENGTH: 60,
  CONTAINER_HEIGHT: '65vh',
  MOBILE_CONTAINER_HEIGHT: '70vh',
  MOBILE_BREAKPOINT: 768,
} as const

export const MESSAGES = {
  CONFIRM_DELETE: 'Remover esta palavra do vocabulário?',
  CONFIRM_CLEAR_ALL:
    'Limpar todo o vocabulário? Esta ação não pode ser desfeita.',
  NO_ITEMS: 'Nenhuma palavra salva ainda',
  NO_RESULTS: 'Nenhuma palavra encontrada',
  HINT: 'Selecione palavras nas legendas para salvá-las aqui',
} as const

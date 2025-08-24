export const POPUP_CONFIG = {
  DEBOUNCE: {
    SELECTION: 300,
    SHOW: 100,
  },
  DIMENSIONS: {
    WIDTH: 400,
    HEIGHT: 300,
    TOP_OFFSET: 80,
    TOP_OFFSET_VOCABULARY: 100,
  },
  ANIMATION: {
    HIDE_DELAY: 1000,
    CLICK_OUTSIDE_DELAY: 10,
  },
} as const

export const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Português',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ru: 'Русский',
  ar: 'العربية',
} as const

export const MAX_MEANINGS_PREVIEW = 3

export const CSS_SELECTORS = {
  SUBTITLE_DISPLAY: '.subtitle-display',
  SUBTITLE_LINE: '.subtitle-line',
  SUBTITLE_SECONDARY: 'subtitle__secondary',
} as const

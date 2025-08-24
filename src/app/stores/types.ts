export const SUBTITLE_LANGUAGE_TYPE = {
  NATIVE: 'native',
  LEARNING: 'learning',
} as const

export type SubtitleLanguageType =
  (typeof SUBTITLE_LANGUAGE_TYPE)[keyof typeof SUBTITLE_LANGUAGE_TYPE]

export interface StoredSettings {
  languages?: {
    native: string
    learning: string
  }
  blurNativeSubtitle?: boolean
  showNativeSubtitle?: boolean
  showLearningSubtitle?: boolean
  isEnabled?: boolean
  subtitleViewMode?: string
  providers?: {
    translation?: string
    dictionary?: string
    targetLanguage?: string
  }
  enableArrowKeyNavigation?: boolean
  highlightVocabulary?: boolean
}

export const PROVIDER_TYPE = {
  TRANSLATION: 'translation',
  DICTIONARY: 'dictionary',
  TARGET_LANGUAGE: 'targetLanguage',
} as const

export type ProviderType = (typeof PROVIDER_TYPE)[keyof typeof PROVIDER_TYPE]

export const DEFAULT_PROVIDERS = {
  [PROVIDER_TYPE.TRANSLATION]: 'mymemory',
  [PROVIDER_TYPE.DICTIONARY]: 'freedictionary',
  [PROVIDER_TYPE.TARGET_LANGUAGE]: 'pt',
} as const

export interface StoreError {
  message: string
  code?: string
  timestamp: number
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasProperty<
  T extends Record<string, unknown>,
  K extends string,
>(obj: T, key: K): obj is T & Record<K, unknown> {
  return key in obj
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

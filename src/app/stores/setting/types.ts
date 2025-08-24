import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface State {
  languages: {
    native: GLOBAL_LANGUAGES
    learning: GLOBAL_LANGUAGES
  }
  blurNativeSubtitle: boolean
  showNativeSubtitle: boolean
  showLearningSubtitle: boolean
  isFirstTimeUser: boolean
  isEnabled: boolean
  subtitleViewMode: SUBTITLE_VIEW_MODE
  providers: {
    translation: string
    dictionary: string
    targetLanguage: string
  }
  enableArrowKeyNavigation: boolean
  highlightVocabulary: boolean
}

export const enum SUBTITLE_VIEW_MODE {
  UNIFIED = 'unified',
  TABS = 'tabs',
}

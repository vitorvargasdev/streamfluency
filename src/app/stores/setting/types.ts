import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface State {
  languages: {
    native: GLOBAL_LANGUAGES
    learning: GLOBAL_LANGUAGES
  }
  blurNativeSubtitle: boolean
  showNativeSubtitle: boolean
  isFirstTimeUser: boolean
  isEnabled: boolean
  subtitleViewMode: 'unified' | 'tabs'
  providers: {
    translation: string
    dictionary: string
    targetLanguage: string
  }
}

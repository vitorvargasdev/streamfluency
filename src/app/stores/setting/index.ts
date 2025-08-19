import { defineStore } from 'pinia'
import { State } from './types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { useSubtitleStore } from '@/app/stores/subtitle'

const STORAGE_KEY = 'openfluency_settings'

export const useSettingStore = defineStore('setting', {
  state: (): State => ({
    languages: {
      native: GLOBAL_LANGUAGES.PTBR,
      learning: GLOBAL_LANGUAGES.EN,
    },
    blurNativeSubtitle: true,
    showNativeSubtitle: true,
    showLearningSubtitle: true,
    isFirstTimeUser: true,
    isEnabled: true,
    subtitleViewMode: 'unified',
    providers: {
      translation: 'mymemory',
      dictionary: 'freedictionary',
      targetLanguage: 'pt',
    },
    enableArrowKeyNavigation: false,
  }),
  getters: {
    nativeLanguage(state) {
      return state.languages.native
    },
    learningLanguage(state) {
      return state.languages.learning
    },
    isNativeSubtitleBlurred(state) {
      return state.blurNativeSubtitle
    },
    isNativeSubtitleVisible(state) {
      return state.showNativeSubtitle
    },
    isLearningSubtitleVisible(state) {
      return state.showLearningSubtitle
    },
    isAppEnabled(state) {
      return state.isEnabled
    },
    getSubtitleViewMode(state) {
      return state.subtitleViewMode
    },
    isArrowKeyNavigationEnabled(state) {
      return state.enableArrowKeyNavigation
    },
  },
  actions: {
    saveToLocalStorage() {
      const data = {
        languages: this.languages,
        blurNativeSubtitle: this.blurNativeSubtitle,
        showNativeSubtitle: this.showNativeSubtitle,
        showLearningSubtitle: this.showLearningSubtitle,
        isEnabled: this.isEnabled,
        subtitleViewMode: this.subtitleViewMode,
        providers: this.providers,
        enableArrowKeyNavigation: this.enableArrowKeyNavigation,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },

    loadFromLocalStorage(): boolean {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          this.languages = data.languages || this.languages
          this.blurNativeSubtitle =
            data.blurNativeSubtitle ?? this.blurNativeSubtitle
          this.showNativeSubtitle =
            data.showNativeSubtitle ?? this.showNativeSubtitle
          this.showLearningSubtitle =
            data.showLearningSubtitle ?? this.showLearningSubtitle
          this.isEnabled = data.isEnabled ?? this.isEnabled
          this.subtitleViewMode = data.subtitleViewMode ?? this.subtitleViewMode
          this.enableArrowKeyNavigation =
            data.enableArrowKeyNavigation ?? this.enableArrowKeyNavigation
          // Ensure providers are properly loaded with defaults
          this.providers = {
            translation: data.providers?.translation || 'mymemory',
            dictionary: data.providers?.dictionary || 'freedictionary',
            targetLanguage: data.providers?.targetLanguage || 'pt',
          }
          this.isFirstTimeUser = false
          return true
        } catch (e) {
          console.error('Failed to load settings from localStorage', e)
        }
      }
      return false
    },

    hasUserSetLanguages(): boolean {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          return (
            data.languages && data.languages.native && data.languages.learning
          )
        } catch (e) {
          return false
        }
      }
      return false
    },

    async setLanguages(native: GLOBAL_LANGUAGES, learning: GLOBAL_LANGUAGES) {
      const hasChanged =
        this.languages.native !== native || this.languages.learning !== learning

      this.languages.native = native
      this.languages.learning = learning
      this.isFirstTimeUser = false
      this.saveToLocalStorage()

      if (hasChanged) {
        const subtitleStore = useSubtitleStore()
        await subtitleStore.fetchSubtitles(native, learning)
      }
    },

    toggleNativeSubtitleBlur() {
      this.blurNativeSubtitle = !this.blurNativeSubtitle
      this.saveToLocalStorage()
    },

    toggleNativeSubtitleVisibility() {
      this.showNativeSubtitle = !this.showNativeSubtitle
      this.saveToLocalStorage()
    },

    toggleLearningSubtitleVisibility() {
      this.showLearningSubtitle = !this.showLearningSubtitle
      this.saveToLocalStorage()
    },

    toggleAppEnabled() {
      this.isEnabled = !this.isEnabled
      this.saveToLocalStorage()

      const subtitleStore = useSubtitleStore()
      if (this.isEnabled) {
        subtitleStore.hideNativeCaptions()
      } else {
        subtitleStore.showNativeCaptions()
      }
    },

    toggleSubtitleViewMode() {
      this.subtitleViewMode =
        this.subtitleViewMode === 'unified' ? 'tabs' : 'unified'
      this.saveToLocalStorage()
    },

    setTranslationProvider(provider: string) {
      this.providers.translation = provider
      this.saveToLocalStorage()
    },

    setDictionaryProvider(provider: string) {
      this.providers.dictionary = provider
      this.saveToLocalStorage()
    },

    setTargetLanguage(language: string) {
      this.providers.targetLanguage = language
      this.saveToLocalStorage()
    },

    toggleArrowKeyNavigation() {
      this.enableArrowKeyNavigation = !this.enableArrowKeyNavigation
      this.saveToLocalStorage()
    },
  },
})

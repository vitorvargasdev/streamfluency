import { defineStore } from 'pinia'
import { State, SUBTITLE_VIEW_MODE } from './types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { useSubtitleStore } from '@/app/stores/subtitle'
import {
  StoredSettings,
  DEFAULT_PROVIDERS as STORE_DEFAULT_PROVIDERS,
  isRecord,
  isString,
} from '../types'

const STORAGE_KEY = 'streamfluency_settings'

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
    subtitleViewMode: SUBTITLE_VIEW_MODE.TABS,
    providers: { ...STORE_DEFAULT_PROVIDERS },
    enableArrowKeyNavigation: false,
  }),

  getters: {
    nativeLanguage: (state): GLOBAL_LANGUAGES => state.languages.native,
    learningLanguage: (state): GLOBAL_LANGUAGES => state.languages.learning,
    isNativeSubtitleBlurred: (state): boolean => state.blurNativeSubtitle,
    isNativeSubtitleVisible: (state): boolean => state.showNativeSubtitle,
    isLearningSubtitleVisible: (state): boolean => state.showLearningSubtitle,
    isAppEnabled: (state): boolean => state.isEnabled,
    getSubtitleViewMode: (state): SUBTITLE_VIEW_MODE => state.subtitleViewMode,
    isArrowKeyNavigationEnabled: (state): boolean =>
      state.enableArrowKeyNavigation,
  },

  actions: {
    saveToLocalStorage(): void {
      try {
        const data = this.getSettingsData()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error)
      }
    },

    getSettingsData() {
      return {
        languages: this.languages,
        blurNativeSubtitle: this.blurNativeSubtitle,
        showNativeSubtitle: this.showNativeSubtitle,
        showLearningSubtitle: this.showLearningSubtitle,
        isEnabled: this.isEnabled,
        subtitleViewMode: this.subtitleViewMode,
        providers: this.providers,
        enableArrowKeyNavigation: this.enableArrowKeyNavigation,
      }
    },

    loadFromLocalStorage(): boolean {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return false

        const data = this.parseStoredSettings(stored)
        if (!data) return false

        this.applyStoredSettings(data)
        this.isFirstTimeUser = false

        return true
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error)
        return false
      }
    },

    parseStoredSettings(stored: string): StoredSettings | null {
      try {
        const parsed: unknown = JSON.parse(stored)
        if (!isRecord(parsed)) return null
        return parsed as StoredSettings
      } catch (error) {
        console.error('Failed to parse stored settings:', error)
        return null
      }
    },

    applyStoredSettings(data: StoredSettings): void {
      if (this.isValidLanguageConfig(data.languages)) {
        this.languages = data.languages
      }

      this.blurNativeSubtitle =
        data.blurNativeSubtitle ?? this.blurNativeSubtitle
      this.showNativeSubtitle =
        data.showNativeSubtitle ?? this.showNativeSubtitle
      this.showLearningSubtitle =
        data.showLearningSubtitle ?? this.showLearningSubtitle
      this.isEnabled = data.isEnabled ?? this.isEnabled
      this.enableArrowKeyNavigation =
        data.enableArrowKeyNavigation ?? this.enableArrowKeyNavigation

      if (
        data.subtitleViewMode &&
        this.isValidViewMode(data.subtitleViewMode)
      ) {
        this.subtitleViewMode = data.subtitleViewMode as SUBTITLE_VIEW_MODE
      }

      this.providers = {
        translation:
          data.providers?.translation || STORE_DEFAULT_PROVIDERS.translation,
        dictionary:
          data.providers?.dictionary || STORE_DEFAULT_PROVIDERS.dictionary,
        targetLanguage:
          data.providers?.targetLanguage ||
          STORE_DEFAULT_PROVIDERS.targetLanguage,
      }
    },

    isValidLanguageConfig(languages: unknown): languages is State['languages'] {
      if (!isRecord(languages)) return false

      const validLanguages = [
        GLOBAL_LANGUAGES.EN,
        GLOBAL_LANGUAGES.ES,
        GLOBAL_LANGUAGES.PTBR,
        GLOBAL_LANGUAGES.JA,
      ]

      return (
        isString(languages.native) &&
        isString(languages.learning) &&
        validLanguages.includes(languages.native as GLOBAL_LANGUAGES) &&
        validLanguages.includes(languages.learning as GLOBAL_LANGUAGES)
      )
    },

    isValidViewMode(mode: unknown): mode is SUBTITLE_VIEW_MODE {
      return (
        mode === SUBTITLE_VIEW_MODE.UNIFIED || mode === SUBTITLE_VIEW_MODE.TABS
      )
    },

    hasUserSetLanguages(): boolean {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false

      const data = this.parseStoredSettings(stored)
      if (!data) return false

      return this.isValidLanguageConfig(data.languages)
    },

    async setLanguages(
      native: GLOBAL_LANGUAGES,
      learning: GLOBAL_LANGUAGES
    ): Promise<void> {
      const hasChanged = this.hasLanguagesChanged(native, learning)
      if (!hasChanged) return

      this.languages.native = native
      this.languages.learning = learning
      this.isFirstTimeUser = false
      this.saveToLocalStorage()

      await this.refreshSubtitles(native, learning)
    },

    hasLanguagesChanged(
      native: GLOBAL_LANGUAGES,
      learning: GLOBAL_LANGUAGES
    ): boolean {
      return (
        this.languages.native !== native || this.languages.learning !== learning
      )
    },

    async refreshSubtitles(
      native: GLOBAL_LANGUAGES,
      learning: GLOBAL_LANGUAGES
    ): Promise<void> {
      const subtitleStore = useSubtitleStore()
      await subtitleStore.fetchSubtitles(native, learning)
    },

    toggleNativeSubtitleVisibility(): void {
      this.showNativeSubtitle = !this.showNativeSubtitle
      this.saveToLocalStorage()
    },

    toggleLearningSubtitleVisibility(): void {
      this.showLearningSubtitle = !this.showLearningSubtitle
      this.saveToLocalStorage()
    },

    toggleAppEnabled(): void {
      this.isEnabled = !this.isEnabled
      this.saveToLocalStorage()
      this.updateNativeCaptions()
    },

    updateNativeCaptions(): void {
      const subtitleStore = useSubtitleStore()

      if (this.isEnabled) {
        subtitleStore.hideNativeCaptions()
        return
      }

      subtitleStore.showNativeCaptions()
    },

    toggleSubtitleViewMode(): void {
      this.subtitleViewMode =
        this.subtitleViewMode === SUBTITLE_VIEW_MODE.UNIFIED
          ? SUBTITLE_VIEW_MODE.TABS
          : SUBTITLE_VIEW_MODE.UNIFIED

      this.saveToLocalStorage()
    },

    setTranslationProvider(provider: string): void {
      if (!provider) return

      this.providers.translation = provider
      this.saveToLocalStorage()
    },

    setDictionaryProvider(provider: string): void {
      if (!provider) return

      this.providers.dictionary = provider
      this.saveToLocalStorage()
    },

    setTargetLanguage(language: string): void {
      if (!language) return

      this.providers.targetLanguage = language
      this.saveToLocalStorage()
    },

    toggleArrowKeyNavigation(): void {
      this.enableArrowKeyNavigation = !this.enableArrowKeyNavigation
      this.saveToLocalStorage()
    },
  },
})

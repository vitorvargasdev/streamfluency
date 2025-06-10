import { defineStore } from 'pinia'
import { State } from './types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { useSubtitleStore } from '@/app/stores/subtitle'

export const useSettingStore = defineStore('setting', {
  state: (): State => ({
    languages: {
      native: GLOBAL_LANGUAGES.EN,
      learning: GLOBAL_LANGUAGES.JA,
    },
  }),
  getters: {
    nativeLanguage(state) {
      return state.languages.native
    },
    learningLanguage(state) {
      return state.languages.learning
    },
  },
  actions: {
    async setLanguages(native: GLOBAL_LANGUAGES, learning: GLOBAL_LANGUAGES) {
      this.languages.native = native
      this.languages.learning = learning

      const subtitleStore = useSubtitleStore()
      await subtitleStore.fetchSubtitles(native, learning)
    },
  },
})

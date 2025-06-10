import { defineStore } from 'pinia'
import { State } from './types'
import getPlatform from '@/app/utils/getPlatform'
import { SubtitleService } from '@/app/services/subtitles/subtitle.service'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { usePlayerStore } from '@/app/stores/player'
import { Subtitle } from '@/app/services/subtitles/types'

export const useSubtitleStore = defineStore('subtitle', {
  state: (): State => ({
    subtitleService: undefined,
    isSubtitlesOn: false,
    subtitles: {
      native: [],
      learning: [],
    },
    currentSubtitles: {
      native: null,
      learning: null,
    },
  }),
  getters: {
    nativeSubtitles(state): Subtitle[] {
      return state.subtitles.native
    },
    learningSubtitles(state): Subtitle[] {
      return state.subtitles.learning
    },
    getCurrentNativeSubtitle(state): string {
      return state.currentSubtitles.native?.text ?? ''
    },
    getCurrentLearningSubtitle(state): string {
      return state.currentSubtitles.learning?.text ?? ''
    },
  },
  actions: {
    load() {
      const platform = getPlatform()
      this.subtitleService = new SubtitleService(platform)
    },
    async fetchSubtitles(
      nativeLanguage: GLOBAL_LANGUAGES,
      learningLanguage: GLOBAL_LANGUAGES
    ): Promise<void> {
      if (!this.subtitleService) throw new Error('Subtitle service not loaded')
      this.subtitles.native =
        await this.subtitleService.fetchSubtitles(nativeLanguage)
      this.subtitles.learning =
        await this.subtitleService.fetchSubtitles(learningLanguage)
    },
    fetchCurrentSubtitles(): void {
      if (!this.subtitleService) throw new Error('Subtitle service not loaded')
      const playerStore = usePlayerStore()

      if (playerStore.isPaused()) return

      this.currentSubtitles.native = this.subtitleService.getCurrentSubtitle(
        this.subtitles.native,
        playerStore.currentTime()
      )

      this.currentSubtitles.learning = this.subtitleService.getCurrentSubtitle(
        this.subtitles.learning,
        playerStore.currentTime()
      )
    },
    setSubtitlesOn(isSubtitlesOn: boolean): void {
      this.isSubtitlesOn = isSubtitlesOn
    },
    subtitlesOn(): void {
      if (!this.isSubtitlesOn) return
      this.fetchCurrentSubtitles()

      setTimeout(() => this.subtitlesOn(), 500)
    },
  },
})

import { defineStore } from 'pinia'
import { State } from './types'
import getPlatform from '@/app/utils/getPlatform'
import { SubtitleService } from '@/app/services/subtitle/subtitle.service'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { usePlayerStore } from '@/app/stores/player'
import { Subtitle } from '@/app/services/subtitle/types'

export const useSubtitleStore = defineStore('subtitle', {
  state: (): State => ({
    subtitleService: undefined,
    isSubtitlesOn: false,
    isLoopingSubtitle: false,
    loopingSubtitle: null,
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

      // Try to fetch learning language subtitles first (priority)
      try {
        this.subtitles.learning =
          await this.subtitleService.fetchSubtitles(learningLanguage)
      } catch (error) {
        console.warn(
          `Could not fetch learning language (${learningLanguage}) subtitles:`,
          error
        )
        this.subtitles.learning = []
      }

      // Try to fetch native language subtitles
      try {
        this.subtitles.native =
          await this.subtitleService.fetchSubtitles(nativeLanguage)
      } catch (error) {
        console.warn(
          `Could not fetch native language (${nativeLanguage}) subtitles:`,
          error
        )
        this.subtitles.native = []
      }

      // If we have at least one language, consider it a success
      if (
        this.subtitles.learning.length === 0 &&
        this.subtitles.native.length === 0
      ) {
        console.error('No subtitles available in any language')
      }
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
    hideNativeCaptions(): void {
      if (!this.subtitleService) throw new Error('Subtitle service not loaded')
      this.subtitleService.hideNativeCaptions()
    },
    showNativeCaptions(): void {
      if (!this.subtitleService) throw new Error('Subtitle service not loaded')
      this.subtitleService.showNativeCaptions()
    },
    goToPreviousSubtitle(): void {
      const playerStore = usePlayerStore()

      if (!playerStore.playerService) {
        console.warn('Player service not available')
        return
      }

      const currentTime = playerStore.currentTime()

      const subtitles =
        this.subtitles.learning.length > 0
          ? this.subtitles.learning
          : this.subtitles.native

      if (subtitles.length === 0) {
        console.warn('No subtitles available')
        return
      }

      const currentIndex = subtitles.findIndex(
        (subtitle) =>
          currentTime >= subtitle.begin && currentTime <= subtitle.end
      )

      if (currentIndex > 0) {
        // Go to the previous subtitle
        playerStore.seekTo(subtitles[currentIndex - 1].begin)
      } else if (currentIndex === -1) {
        // We're between subtitles, find the last subtitle before current time
        for (let i = subtitles.length - 1; i >= 0; i--) {
          if (subtitles[i].end < currentTime) {
            playerStore.seekTo(subtitles[i].begin)
            break
          }
        }
      } else if (currentIndex === 0) {
        // We're at the first subtitle, stay at the beginning
        playerStore.seekTo(subtitles[0].begin)
      }
    },
    replayCurrentSubtitle(): void {
      const playerStore = usePlayerStore()

      if (!playerStore.playerService) {
        return
      }

      const currentTime = playerStore.currentTime()

      const subtitles =
        this.subtitles.learning.length > 0
          ? this.subtitles.learning
          : this.subtitles.native

      if (subtitles.length === 0) {
        return
      }

      const currentSubtitle = subtitles.find(
        (subtitle) =>
          currentTime >= subtitle.begin && currentTime <= subtitle.end
      )

      if (currentSubtitle) {
        playerStore.seekTo(currentSubtitle.begin)
      } else {
        // Find the last subtitle before current time
        for (let i = 0; i < subtitles.length; i++) {
          if (subtitles[i].begin > currentTime) {
            if (i > 0) {
              playerStore.seekTo(subtitles[i - 1].begin)
            }
            break
          }
        }
      }
    },
    goToNextSubtitle(): void {
      const playerStore = usePlayerStore()

      if (!playerStore.playerService) {
        console.warn('Player service not available')
        return
      }

      const currentTime = playerStore.currentTime()

      const subtitles =
        this.subtitles.learning.length > 0
          ? this.subtitles.learning
          : this.subtitles.native

      if (subtitles.length === 0) {
        console.warn('No subtitles available')
        return
      }

      const currentIndex = subtitles.findIndex(
        (subtitle) =>
          currentTime >= subtitle.begin && currentTime <= subtitle.end
      )

      if (currentIndex !== -1 && currentIndex < subtitles.length - 1) {
        // We're in a subtitle and there's a next one
        playerStore.seekTo(subtitles[currentIndex + 1].begin)
      } else if (currentIndex === -1) {
        // We're between subtitles, find the next one
        for (let i = 0; i < subtitles.length; i++) {
          if (subtitles[i].begin > currentTime) {
            playerStore.seekTo(subtitles[i].begin)
            break
          }
        }
      } else if (currentIndex === subtitles.length - 1) {
        // We're at the last subtitle, do nothing or could restart from beginning
        console.log('Already at the last subtitle')
      }
    },
    toggleLoopSubtitle(): void {
      const playerStore = usePlayerStore()

      if (!playerStore.playerService) {
        return
      }

      if (this.isLoopingSubtitle) {
        // Stop looping
        this.isLoopingSubtitle = false
        this.loopingSubtitle = null
      } else {
        // Start looping current subtitle
        const currentTime = playerStore.currentTime()
        const subtitles =
          this.subtitles.learning.length > 0
            ? this.subtitles.learning
            : this.subtitles.native

        if (subtitles.length === 0) {
          return
        }

        const currentSubtitle = subtitles.find(
          (subtitle) =>
            currentTime >= subtitle.begin && currentTime <= subtitle.end
        )

        if (currentSubtitle) {
          this.isLoopingSubtitle = true
          this.loopingSubtitle = currentSubtitle
          this.startSubtitleLoop()
        }
      }
    },
    startSubtitleLoop(): void {
      if (!this.isLoopingSubtitle || !this.loopingSubtitle) {
        return
      }

      const playerStore = usePlayerStore()
      const currentTime = playerStore.currentTime()

      // Check if we're still within the looping subtitle
      if (
        currentTime >= this.loopingSubtitle.begin &&
        currentTime <= this.loopingSubtitle.end
      ) {
        // Continue checking
        setTimeout(() => this.startSubtitleLoop(), 100)
      } else if (currentTime > this.loopingSubtitle.end) {
        // Subtitle ended, restart it
        playerStore.seekTo(this.loopingSubtitle.begin)
        setTimeout(() => this.startSubtitleLoop(), 100)
      } else {
        // We're before the subtitle, seek to it
        playerStore.seekTo(this.loopingSubtitle.begin)
        setTimeout(() => this.startSubtitleLoop(), 100)
      }
    },
  },
})

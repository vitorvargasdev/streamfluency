import { defineStore } from 'pinia'
import { State } from './types'
import getPlatform from '@/app/utils/getPlatform'
import { SubtitleService } from '@/app/services/subtitle/subtitle.service'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { usePlayerStore } from '@/app/stores/player'
import { Subtitle } from '@/app/services/subtitle/types'
import { SubtitleLanguageType, SUBTITLE_LANGUAGE_TYPE } from '../types'

const SUBTITLE_UPDATE_INTERVAL = 500
const LOOP_CHECK_INTERVAL = 100
const SERVICE_NOT_LOADED_ERROR = 'Subtitle service not loaded'

export const useSubtitleStore = defineStore('subtitle', {
  state: (): State => ({
    subtitleService: undefined,
    isSubtitlesOn: false,
    isLoopingSubtitle: false,
    loopingSubtitle: null,
    loopIntervalId: null,
    subtitleUpdateIntervalId: null,
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
    nativeSubtitles: (state): Subtitle[] => state.subtitles.native,
    learningSubtitles: (state): Subtitle[] => state.subtitles.learning,
    getCurrentNativeSubtitle: (state): string =>
      state.currentSubtitles.native?.text ?? '',
    getCurrentLearningSubtitle: (state): string =>
      state.currentSubtitles.learning?.text ?? '',
    hasSubtitles: (state): boolean =>
      state.subtitles.learning.length > 0 || state.subtitles.native.length > 0,
    activeSubtitleTrack: (state): Subtitle[] =>
      state.subtitles.learning.length > 0
        ? state.subtitles.learning
        : state.subtitles.native,
  },

  actions: {
    load(): void {
      const platform = getPlatform()
      this.subtitleService = new SubtitleService(platform)
    },

    async fetchSubtitles(
      nativeLanguage: GLOBAL_LANGUAGES,
      learningLanguage: GLOBAL_LANGUAGES
    ): Promise<void> {
      this.validateServiceLoaded()

      await Promise.all([
        this.fetchLanguageSubtitles(
          learningLanguage,
          SUBTITLE_LANGUAGE_TYPE.LEARNING
        ),
        this.fetchLanguageSubtitles(
          nativeLanguage,
          SUBTITLE_LANGUAGE_TYPE.NATIVE
        ),
      ])
    },

    async fetchLanguageSubtitles(
      language: GLOBAL_LANGUAGES,
      type: SubtitleLanguageType
    ): Promise<void> {
      try {
        this.subtitles[type] =
          await this.subtitleService!.fetchSubtitles(language)
      } catch (error) {
        this.subtitles[type] = []
      }
    },

    fetchCurrentSubtitles(): void {
      this.validateServiceLoaded()

      const playerStore = usePlayerStore()
      if (playerStore.isPaused()) return

      const currentTime = playerStore.currentTime()
      this.updateCurrentSubtitles(currentTime)
    },

    updateCurrentSubtitles(currentTime: number): void {
      this.currentSubtitles.native = this.subtitleService!.getCurrentSubtitle(
        this.subtitles.native,
        currentTime
      )

      this.currentSubtitles.learning = this.subtitleService!.getCurrentSubtitle(
        this.subtitles.learning,
        currentTime
      )
    },

    setSubtitlesOn(isSubtitlesOn: boolean): void {
      this.isSubtitlesOn = isSubtitlesOn

      if (isSubtitlesOn) {
        this.startSubtitleUpdates()
        return
      }

      this.stopSubtitleUpdates()
    },

    subtitlesOn(): void {
      this.startSubtitleUpdates()
    },

    startSubtitleUpdates(): void {
      if (!this.isSubtitlesOn) return

      this.fetchCurrentSubtitles()

      if (this.subtitleUpdateIntervalId) {
        clearInterval(this.subtitleUpdateIntervalId)
      }

      this.subtitleUpdateIntervalId = setInterval(
        () => this.fetchCurrentSubtitles(),
        SUBTITLE_UPDATE_INTERVAL
      ) as unknown as NodeJS.Timeout
    },

    stopSubtitleUpdates(): void {
      if (!this.subtitleUpdateIntervalId) return

      clearInterval(this.subtitleUpdateIntervalId)
      this.subtitleUpdateIntervalId = null
    },

    hideNativeCaptions(): void {
      this.validateServiceLoaded()
      this.subtitleService!.hideNativeCaptions()
    },

    showNativeCaptions(): void {
      this.validateServiceLoaded()
      this.subtitleService!.showNativeCaptions()
    },

    goToPreviousSubtitle(): void {
      const { playerStore, currentTime, subtitles } =
        this.getNavigationContext()
      if (!playerStore || subtitles.length === 0) return

      const targetTime = this.findPreviousSubtitleTime(subtitles, currentTime)
      if (targetTime === null) return

      playerStore.seekTo(targetTime)
    },

    goToNextSubtitle(): void {
      const { playerStore, currentTime, subtitles } =
        this.getNavigationContext()
      if (!playerStore || subtitles.length === 0) return

      const targetTime = this.findNextSubtitleTime(subtitles, currentTime)

      if (targetTime === null) return

      playerStore.seekTo(targetTime)
    },

    toggleLoopSubtitle(): void {
      if (this.isLoopingSubtitle) {
        this.stopSubtitleLoop()
        return
      }

      this.initializeSubtitleLoop()
    },

    initializeSubtitleLoop(): void {
      const { playerStore, currentTime, subtitles } =
        this.getNavigationContext()
      if (!playerStore || subtitles.length === 0) return

      const currentSubtitle = this.findSubtitleAtTime(subtitles, currentTime)
      if (!currentSubtitle) return

      this.isLoopingSubtitle = true
      this.loopingSubtitle = currentSubtitle
      this.runSubtitleLoop()
    },

    stopSubtitleLoop(): void {
      this.isLoopingSubtitle = false
      this.loopingSubtitle = null

      if (!this.loopIntervalId) return

      clearInterval(this.loopIntervalId)
      this.loopIntervalId = null
    },

    runSubtitleLoop(): void {
      if (!this.isLoopingSubtitle || !this.loopingSubtitle) {
        this.stopSubtitleLoop()
        return
      }

      this.loopIntervalId = setInterval(() => {
        this.checkAndRestartLoop()
      }, LOOP_CHECK_INTERVAL) as unknown as NodeJS.Timeout
    },

    checkAndRestartLoop(): void {
      if (!this.isLoopingSubtitle || !this.loopingSubtitle) {
        this.stopSubtitleLoop()
        return
      }

      const playerStore = usePlayerStore()
      const currentTime = playerStore.currentTime()
      const { begin, end } = this.loopingSubtitle

      const isOutsideLoop = currentTime < begin || currentTime > end
      if (!isOutsideLoop) return

      playerStore.seekTo(begin)
    },

    getNavigationContext() {
      const playerStore = usePlayerStore()

      if (!playerStore.playerService) {
        return { playerStore: null, currentTime: 0, subtitles: [] }
      }

      const subtitles = this.activeSubtitleTrack

      return {
        playerStore,
        currentTime: playerStore.currentTime(),
        subtitles,
      }
    },

    findSubtitleAtTime(subtitles: Subtitle[], time: number): Subtitle | null {
      return (
        subtitles.find((subtitle) => this.isTimeInSubtitle(time, subtitle)) ??
        null
      )
    },

    findLastSubtitleBeforeTime(
      subtitles: Subtitle[],
      time: number
    ): Subtitle | null {
      for (let i = subtitles.length - 1; i >= 0; i--) {
        if (subtitles[i].end < time) {
          return subtitles[i]
        }
      }
      return null
    },

    findNextSubtitleAfterTime(
      subtitles: Subtitle[],
      time: number
    ): Subtitle | null {
      return subtitles.find((subtitle) => subtitle.begin > time) ?? null
    },

    findPreviousSubtitleTime(
      subtitles: Subtitle[],
      currentTime: number
    ): number | null {
      const currentIndex = this.findCurrentSubtitleIndex(subtitles, currentTime)

      if (currentIndex > 0) {
        return subtitles[currentIndex - 1].begin
      }

      if (currentIndex === 0) {
        return subtitles[0].begin
      }

      const previousSubtitle = this.findLastSubtitleBeforeTime(
        subtitles,
        currentTime
      )
      return previousSubtitle?.begin ?? null
    },

    findNextSubtitleTime(
      subtitles: Subtitle[],
      currentTime: number
    ): number | null {
      const currentIndex = this.findCurrentSubtitleIndex(subtitles, currentTime)

      if (currentIndex >= 0 && currentIndex < subtitles.length - 1) {
        return subtitles[currentIndex + 1].begin
      }

      const nextSubtitle = this.findNextSubtitleAfterTime(
        subtitles,
        currentTime
      )
      return nextSubtitle?.begin ?? null
    },

    findCurrentSubtitleIndex(subtitles: Subtitle[], time: number): number {
      return subtitles.findIndex((subtitle) =>
        this.isTimeInSubtitle(time, subtitle)
      )
    },

    isTimeInSubtitle(time: number, subtitle: Subtitle): boolean {
      return time >= subtitle.begin && time <= subtitle.end
    },

    validateServiceLoaded(): void {
      if (!this.subtitleService) {
        throw new Error(SERVICE_NOT_LOADED_ERROR)
      }
    },
  },
})

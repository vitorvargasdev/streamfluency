import { defineStore } from 'pinia'
import { State } from './types'
import getPlatform from '@/app/utils/getPlatform'
import { PlayerService } from '@/app/services/player/player.service'

const SERVICE_NOT_LOADED_ERROR = 'Player service not loaded'

export const usePlayerStore = defineStore('player', {
  state: (): State => ({
    playerService: null,
  }),

  getters: {},

  actions: {
    load(): void {
      const platform = getPlatform()
      this.playerService = new PlayerService(platform)
    },

    play(): void {
      this.validateServiceLoaded()
      this.playerService!.play()
    },

    pause(): void {
      this.validateServiceLoaded()
      this.playerService!.pause()
    },

    isPaused(): boolean {
      if (!this.playerService) return true
      return this.playerService.isPaused()
    },

    currentTime(): number {
      if (!this.playerService) return 0
      return this.playerService.currentTime()
    },

    seekTo(time: number): void {
      this.validateServiceLoaded()

      if (time < 0) {
        console.warn('Cannot seek to negative time')
        return
      }

      this.playerService!.setTime(time)
    },

    validateServiceLoaded(): void {
      if (!this.playerService) {
        throw new Error(SERVICE_NOT_LOADED_ERROR)
      }
    },
  },
})

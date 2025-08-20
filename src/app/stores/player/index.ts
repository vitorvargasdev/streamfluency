import { defineStore } from 'pinia'
import { State } from './types'
import getPlatform from '@/app/utils/getPlatform'
import { PlayerService } from '@/app/services/player/player.service'

export const usePlayerStore = defineStore('player', {
  state: (): State => ({
    playerService: null,
  }),
  actions: {
    load() {
      const platform = getPlatform()
      this.playerService = new PlayerService(platform)
    },
    play() {
      if (!this.playerService) throw new Error('Player not loaded')
      this.playerService.play()
    },
    pause() {
      if (!this.playerService) throw new Error('Player not loaded')
      this.playerService.pause()
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
      if (!this.playerService) throw new Error('Player not loaded')
      this.playerService.setTime(time)
    },
  },
})

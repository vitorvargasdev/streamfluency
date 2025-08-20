import { IPlayerAdapter } from '@/app/services/player/adapters/IPlayerAdapter'
import { PLATFORM } from '@/app/assets/constants'
import { PlayerError, PlayerErrorCodes } from '@/app/services/player/types'

export class YouTubePlayerAdapter implements IPlayerAdapter {
  name = PLATFORM.YOUTUBE
  private player: HTMLVideoElement | null = null

  constructor() {
    this.initializePlayer()
  }

  private initializePlayer(): void {
    this.player = document.querySelector('video')
    if (!this.player) {
      console.warn('YouTube video element not found, will retry on method calls')
    }
  }

  private getPlayer(): HTMLVideoElement {
    if (!this.player) {
      this.player = document.querySelector('video')
      if (!this.player) {
        throw new PlayerError(
          'YouTube video element not found',
          PlayerErrorCodes.ELEMENT_NOT_FOUND
        )
      }
    }
    return this.player
  }

  play(): void {
    try {
      const player = this.getPlayer()
      player.play().catch(error => {
        throw new PlayerError(
          `Failed to play video: ${error.message}`,
          PlayerErrorCodes.PLAYBACK_FAILED
        )
      })
    } catch (error) {
      console.error('Play failed:', error)
      throw error
    }
  }

  pause(): void {
    try {
      const player = this.getPlayer()
      player.pause()
    } catch (error) {
      console.error('Pause failed:', error)
      throw error
    }
  }

  isPaused(): boolean {
    try {
      const player = this.getPlayer()
      return player.paused
    } catch (error) {
      console.error('isPaused failed:', error)
      return true
    }
  }

  currentTime(): number {
    try {
      const player = this.getPlayer()
      return player.currentTime || 0
    } catch (error) {
      console.error('currentTime failed:', error)
      return 0
    }
  }

  setTime(time: number): void {
    try {
      const player = this.getPlayer()
      
      if (time < 0 || time > player.duration) {
        throw new PlayerError(
          `Invalid time: ${time}. Must be between 0 and ${player.duration}`,
          PlayerErrorCodes.INVALID_TIME
        )
      }
      
      player.currentTime = time
    } catch (error) {
      console.error('setTime failed:', error)
      throw error
    }
  }

  getDuration(): number {
    try {
      const player = this.getPlayer()
      return player.duration || 0
    } catch (error) {
      console.error('getDuration failed:', error)
      return 0
    }
  }

  getPlaybackRate(): number {
    try {
      const player = this.getPlayer()
      return player.playbackRate || 1
    } catch (error) {
      console.error('getPlaybackRate failed:', error)
      return 1
    }
  }

  setPlaybackRate(rate: number): void {
    try {
      const player = this.getPlayer()
      
      if (rate <= 0 || rate > 16) {
        throw new PlayerError(
          `Invalid playback rate: ${rate}. Must be between 0 and 16`,
          PlayerErrorCodes.INVALID_RATE
        )
      }
      
      player.playbackRate = rate
    } catch (error) {
      console.error('setPlaybackRate failed:', error)
      throw error
    }
  }

  isReady(): boolean {
    try {
      const player = this.getPlayer()
      return player.readyState >= 2
    } catch (error) {
      return false
    }
  }

  dispose(): void {
    this.player = null
  }
}

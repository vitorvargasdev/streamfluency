import { PlayerInterface } from '@/app/services/player/player.interface'
import { PLATFORM } from '@/app/assets/constants'
import { IPlayerAdapter } from './adapters/IPlayerAdapter'
import { PlayerAdapterFactory } from './PlayerAdapterFactory'

export class PlayerService implements PlayerInterface {
  platform: IPlayerAdapter

  constructor(platform: PLATFORM) {
    this.platform = PlayerAdapterFactory.create(platform)
  }

  play(): void {
    this.platform.play()
  }

  pause(): void {
    this.platform.pause()
  }

  isPaused(): boolean {
    return this.platform.isPaused()
  }

  currentTime(): number {
    return this.platform.currentTime()
  }

  setTime(time: number): void {
    this.platform.setTime(time)
  }

  getDuration(): number {
    return this.platform.getDuration()
  }

  getPlaybackRate(): number {
    return this.platform.getPlaybackRate()
  }

  setPlaybackRate(rate: number): void {
    this.platform.setPlaybackRate(rate)
  }

  isReady(): boolean {
    return this.platform.isReady()
  }

  dispose(): void {
    this.platform.dispose()
  }
}

import { IPlayerAdapter } from '@/app/services/player/adapters/IPlayerAdapter'

export interface PlayerInterface {
  platform: IPlayerAdapter

  play(): void
  pause(): void
  isPaused(): boolean

  currentTime(): number
  setTime(time: number): void
  getDuration(): number

  getPlaybackRate(): number
  setPlaybackRate(rate: number): void

  isReady(): boolean
  dispose(): void
}

import { IPlayerAdapter } from '@/app/services/player/adapters/IPlayerAdapter'

export interface PlayerInterface {
  platform: IPlayerAdapter

  // Playback controls
  play(): void
  pause(): void
  isPaused(): boolean
  
  // Time management
  currentTime(): number
  setTime(time: number): void
  getDuration(): number
  
  // Playback rate
  getPlaybackRate(): number
  setPlaybackRate(rate: number): void
  
  // Lifecycle
  isReady(): boolean
  dispose(): void
}

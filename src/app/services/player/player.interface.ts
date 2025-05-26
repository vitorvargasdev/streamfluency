import { PlayerPlatformInterface } from '@/app/services/player/platforms/player-platform.interface'

export interface PlayerInterface {
  platform: PlayerPlatformInterface

  play(): void
  pause(): void
  isPaused(): boolean
  currentTime(): number
  setTime(time: number): void
}

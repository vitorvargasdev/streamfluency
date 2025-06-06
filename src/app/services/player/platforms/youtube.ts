import { PlayerPlatformInterface } from '@/app/services/player/platforms/player-platform.interface'
import { PLATFORM } from '@/app/assets/constants'

export class YoutubePlayerPlatform implements PlayerPlatformInterface {
  name = PLATFORM.YOUTUBE
  private player: HTMLVideoElement

  constructor() {
    this.player = document.querySelector('video') as HTMLVideoElement
  }

  play(): void {
    this.player.play()
  }

  pause(): void {
    this.player.pause()
  }

  isPaused(): boolean {
    return this.player.paused
  }

  currentTime(): number {
    return this.player.currentTime
  }

  setTime(time: number): void {
    this.player.currentTime = time
  }
}

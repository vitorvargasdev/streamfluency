import { PlayerInterface } from '@/app/services/player/player.interface'
import { YoutubePlayerPlatform } from '@/app/services/player/platforms/youtube'
import { PLATFORM } from '@/app/services/types'
import { PlayerPlatformInterface } from './platforms/player-platform.interface'

const platforms = {
  [PLATFORM.YOUTUBE]: YoutubePlayerPlatform,
}

export class PlayerService implements PlayerInterface {
  platform: PlayerPlatformInterface

  constructor(platform: PLATFORM) {
    this.platform = new platforms[platform]
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
}

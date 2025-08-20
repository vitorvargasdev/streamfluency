import { PLATFORM } from '@/app/assets/constants'
import { IPlayerAdapter } from './adapters/IPlayerAdapter'
import { YouTubePlayerAdapter } from './adapters/YouTubePlayerAdapter'

export class PlayerAdapterFactory {
  private static adapters: Record<string, new () => IPlayerAdapter> = {
    [PLATFORM.YOUTUBE]: YouTubePlayerAdapter,
  }

  static create(platform: PLATFORM): IPlayerAdapter {
    const AdapterClass = this.adapters[platform]
    
    if (!AdapterClass) {
      throw new Error(`Unsupported platform: ${platform}`)
    }

    return new AdapterClass()
  }

  static isSupported(platform: string): boolean {
    return platform in this.adapters
  }

  static getSupportedPlatforms(): string[] {
    return Object.keys(this.adapters)
  }
}
import { PLATFORM } from '@/app/assets/constants'
import { ISubtitleAdapter } from './adapters/ISubtitleAdapter'
import { YouTubeSubtitleAdapter } from './adapters/YouTubeSubtitleAdapter'

export class SubtitleAdapterFactory {
  private static adapters: Record<string, new () => ISubtitleAdapter> = {
    [PLATFORM.YOUTUBE]: YouTubeSubtitleAdapter,
  }

  static create(platform: PLATFORM): ISubtitleAdapter {
    const AdapterClass = this.adapters[platform]
    
    if (!AdapterClass) {
      throw new Error(`Unsupported subtitle platform: ${platform}`)
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
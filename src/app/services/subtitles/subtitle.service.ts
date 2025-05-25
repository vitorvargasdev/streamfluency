import { PlatformInterface } from './platforms/platform.interface'
import { YoutubePlatform } from './platforms/youtube-platform'
import { SubtitleInterface } from './subtitle.interface'
import { LANGUAGES, PLATFORM, Subtitle } from './types'

const platforms = {
  [PLATFORM.YOUTUBE]: YoutubePlatform,
}

export class SubtitleService implements SubtitleInterface {
  platform: PlatformInterface

  constructor(platform: PLATFORM) {
    this.platform = new platforms[platform]
  }

  async fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]> {
    return this.platform.fetchSubtitles(lang)
  }
}

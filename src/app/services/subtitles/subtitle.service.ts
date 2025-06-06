import { SubtitlePlatformInterface } from '@/app/services/subtitles/platforms/subtitle-platform.interface'
import { YoutubeSubtitlePlatform } from '@/app/services/subtitles/platforms/youtube'
import { SubtitleInterface } from '@/app/services/subtitles/subtitle.interface'
import { Subtitle } from './types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { PLATFORM } from '@/app/assets/constants'

const platforms = {
  [PLATFORM.YOUTUBE]: YoutubeSubtitlePlatform,
}

export class SubtitleService implements SubtitleInterface {
  platform: SubtitlePlatformInterface

  constructor(platform: PLATFORM) {
    this.platform = new platforms[platform]()
  }

  async fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]> {
    return await this.platform.fetchSubtitles(lang)
  }

  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string {
    return this.platform.getCurrentSubtitle(subtitles, currentTime)
  }
}

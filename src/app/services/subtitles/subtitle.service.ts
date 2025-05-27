import { SubtitlePlatformInterface } from '@/app/services/subtitles/platforms/subtitle-platform.interface'
import { YoutubeSubtitlePlatform } from '@/app/services/subtitles/platforms/youtube'
import { SubtitleInterface } from '@/app/services/subtitles/subtitle.interface'
import { LANGUAGES, Subtitle } from './types'
import { PLATFORM } from '@/app/services/types'

const platforms = {
  [PLATFORM.YOUTUBE]: YoutubeSubtitlePlatform,
}

export class SubtitleService implements SubtitleInterface {
  platform: SubtitlePlatformInterface

  constructor(platform: PLATFORM) {
    this.platform = new platforms[platform]()
  }

  async fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]> {
    return this.platform.fetchSubtitles(lang)
  }

  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string {
    return this.platform.getCurrentSubtitle(subtitles, currentTime)
  }
}

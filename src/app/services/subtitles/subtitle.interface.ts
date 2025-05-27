import { SubtitlePlatformInterface } from './platforms/subtitle-platform.interface'
import { LANGUAGES, Subtitle } from './types'

export interface SubtitleInterface {
  platform: SubtitlePlatformInterface

  fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]>
  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string
}

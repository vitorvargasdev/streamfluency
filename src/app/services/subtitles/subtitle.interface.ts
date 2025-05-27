import { SubtitlePlatformInterface } from './platforms/subtitle-platform.interface'
import { Subtitle } from './types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface SubtitleInterface {
  platform: SubtitlePlatformInterface

  fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]>
  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string
}

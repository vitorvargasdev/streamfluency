import { SubtitlePlatformInterface } from './platforms/subtitle-platform.interface'
import { Subtitle } from '@/app/services/subtitles/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface SubtitleInterface {
  platform: SubtitlePlatformInterface

  fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]>
  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): Subtitle | null
}

import { PLATFORM } from '@/app/assets/constants'
import { LANGUAGES, Subtitle } from '@/app/services/subtitles/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface SubtitlePlatformInterface {
  name: PLATFORM
  languageCode: LANGUAGES

  fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]>
  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string
}

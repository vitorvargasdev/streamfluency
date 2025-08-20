import { PLATFORM } from '@/app/assets/constants'
import { LANGUAGES, Subtitle } from '@/app/services/subtitle/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface ISubtitleAdapter {
  name: PLATFORM
  languageCode: LANGUAGES

  fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]>
  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): Subtitle | null
}

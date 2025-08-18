import { ISubtitleAdapter } from './adapters/ISubtitleAdapter'
import { Subtitle } from '@/app/services/subtitle/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

export interface SubtitleInterface {
  platform: ISubtitleAdapter

  fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]>
  getCurrentSubtitle(
    subtitles: Subtitle[],
    currentTime: number
  ): Subtitle | null
  hideNativeCaptions(): void
  showNativeCaptions(): void
}

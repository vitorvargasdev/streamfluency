import { SubtitleInterface } from '@/app/services/subtitle/subtitle.interface'
import { Subtitle } from '@/app/services/subtitle/types'
import { SubtitleLanguageType } from '../types'

export interface State {
  subtitleService: SubtitleInterface | undefined
  isSubtitlesOn: boolean
  isLoopingSubtitle: boolean
  loopingSubtitle: Subtitle | null
  loopIntervalId: NodeJS.Timeout | null
  subtitleUpdateIntervalId: NodeJS.Timeout | null
  subtitles: Record<SubtitleLanguageType, Subtitle[]>
  currentSubtitles: Record<SubtitleLanguageType, Subtitle | null>
}

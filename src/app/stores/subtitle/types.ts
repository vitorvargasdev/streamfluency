import { SubtitleInterface } from '@/app/services/subtitle/subtitle.interface'
import { Subtitle } from '@/app/services/subtitle/types'

export interface State {
  subtitleService: SubtitleInterface | undefined
  isSubtitlesOn: boolean
  isLoopingSubtitle: boolean
  loopingSubtitle: Subtitle | null
  subtitles: {
    native: Subtitle[]
    learning: Subtitle[]
  }
  currentSubtitles: {
    native: Subtitle | null
    learning: Subtitle | null
  }
}

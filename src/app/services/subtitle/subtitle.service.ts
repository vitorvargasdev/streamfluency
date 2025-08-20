import { ISubtitleAdapter } from '@/app/services/subtitle/adapters/ISubtitleAdapter'
import { SubtitleInterface } from '@/app/services/subtitle/subtitle.interface'
import { Subtitle } from './types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { PLATFORM } from '@/app/assets/constants'
import { SubtitleAdapterFactory } from './SubtitleAdapterFactory'

export class SubtitleService implements SubtitleInterface {
  platform: ISubtitleAdapter
  private readonly captionsSelector = '.ytp-caption-window-container'

  constructor(platform: PLATFORM) {
    this.platform = SubtitleAdapterFactory.create(platform)
  }

  async fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]> {
    return await this.platform.fetchSubtitles(lang)
  }

  getCurrentSubtitle(
    subtitles: Subtitle[],
    currentTime: number
  ): Subtitle | null {
    return this.platform.getCurrentSubtitle(subtitles, currentTime)
  }

  hideNativeCaptions(): void {
    const captions = document.querySelector(
      this.captionsSelector
    ) as HTMLElement
    if (captions) {
      captions.style.display = 'none'
    }
  }

  showNativeCaptions(): void {
    const captions = document.querySelector(
      this.captionsSelector
    ) as HTMLElement
    if (captions) {
      captions.style.display = 'block'
    }
  }
}

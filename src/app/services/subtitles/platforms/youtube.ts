import { Subtitle } from '@/app/services/subtitles/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { LANGUAGES } from '@/app/services/subtitles/types'
import { PLATFORM } from '@/app/assets/constants'
import { SubtitlePlatformInterface } from '@/app/services/subtitles/platforms/subtitle-platform.interface'
import parse, {
  YoutubeSubtitle,
} from '@/app/services/subtitles/parsers/youtube-parser'

export class YoutubeSubtitlePlatform implements SubtitlePlatformInterface {
  name = PLATFORM.YOUTUBE
  languageCode: LANGUAGES = {
    [GLOBAL_LANGUAGES.EN]: 'en',
    [GLOBAL_LANGUAGES.PTBR]: 'pt-BR',
    [GLOBAL_LANGUAGES.JA]: 'ja',
  }
  private captionUrl: string = ''

  private getYoutubePlayer(): YoutubePlayer {
    return document.querySelector('#movie_player') as YoutubePlayer
  }

  private async toggleSubtitlesOn(): Promise<void> {
    const player = this.getYoutubePlayer()

    if (player.isSubtitlesOn()) {
      player.toggleSubtitles()
    }

    player.toggleSubtitlesOn()
  }

  private async fetchCaptionTracks(): Promise<CaptionTrack[]> {
    const player = this.getYoutubePlayer()
    const captions = player.getAudioTrack()

    if (!captions) {
      throw new Error('No captions found')
    }

    return captions.captionTracks.map((track) => ({
      languageCode: track.languageCode,
      vssId: track.vssId,
    }))
  }

  private async getSubtitleUrl(): Promise<string> {
    const originalXHR = XMLHttpRequest.prototype.open

    return new Promise((resolve, reject) => {
      let attempts = 0

      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        const urlString = url.toString()
        const asyncValue = async ?? true

        if (!urlString.includes('timedtext')) {
          return originalXHR.call(
            this,
            method,
            url,
            asyncValue,
            username,
            password
          )
        }

        XMLHttpRequest.prototype.open = originalXHR
        resolve(urlString)
        originalXHR.call(this, method, url, asyncValue, username, password)
        return
      }

      const retry = () => {
        attempts++
        if (attempts > 20) {
          XMLHttpRequest.prototype.open = originalXHR
          reject(new Error('Subtitle URL not found'))
          return
        }
        this.toggleSubtitlesOn()
        setTimeout(() => retry, 1000)
      }

      retry()
    })
  }

  private async retrieveSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]> {
    const captions = await this.fetchCaptionTracks()

    const languageCode = this.languageCode[lang]
    const subtitles = captions.find(
      (track) => track.languageCode === languageCode
    )

    if (!subtitles) {
      console.error('No subtitles found')
      return []
    }

    this.captionUrl = await this.getSubtitleUrl()

    const url = new URL(this.captionUrl)
    url.searchParams.set('lang', languageCode)
    try {
      const response = await fetch(url.toString())
      const data = (await response.json()) as YoutubeSubtitle
      return parse(data, 'html')
    } catch (error) {
      console.error(error)
      return []
    }
  }

  async fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]> {
    return await this.retrieveSubtitles(lang)
  }

  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string {
    const activeSubtitles = subtitles
      .filter((sub) => currentTime >= sub.begin && currentTime <= sub.end)
      .map((sub) => sub.text)

    return activeSubtitles.at(-1) ?? ''
  }
}

type Captions = {
  captionTracks: CaptionTrack[]
}

type CaptionTrack = {
  languageCode: string
  vssId: string
}

type YoutubePlayer = {
  getAudioTrack: () => Captions
  isSubtitlesOn: () => boolean
  toggleSubtitles: () => void
  toggleSubtitlesOn: () => void
} & HTMLElement

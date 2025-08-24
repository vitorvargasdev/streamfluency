import { Subtitle } from '@/app/services/subtitle/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { LANGUAGES } from '@/app/services/subtitle/types'
import { PLATFORM } from '@/app/assets/constants'
import { ISubtitleAdapter } from '@/app/services/subtitle/adapters/ISubtitleAdapter'
import parse, {
  YoutubeSubtitle,
} from '@/app/services/subtitle/parsers/YouTubeSubtitleParser'
import {
  SubtitleError,
  SubtitleErrorCodes,
} from '@/app/services/subtitle/types/errors'

export class YouTubeSubtitleAdapter implements ISubtitleAdapter {
  name = PLATFORM.YOUTUBE
  languageCode: LANGUAGES = {
    [GLOBAL_LANGUAGES.EN]: 'en',
    [GLOBAL_LANGUAGES.PTBR]: 'pt-BR',
    [GLOBAL_LANGUAGES.JA]: 'ja',
  }
  private captionUrl: string = ''

  private getYoutubePlayer(): YoutubePlayer {
    const player = document.querySelector('#movie_player') as YoutubePlayer
    if (!player) {
      throw new SubtitleError(
        'YouTube player element not found',
        SubtitleErrorCodes.PLAYER_NOT_FOUND
      )
    }
    return player
  }

  private async toggleSubtitlesOn(): Promise<void> {
    try {
      const player = this.getYoutubePlayer()

      if (player.isSubtitlesOn()) {
        player.toggleSubtitles()
      }

      player.toggleSubtitlesOn()
    } catch (error) {
      throw error
    }
  }

  private async fetchCaptionTracks(): Promise<CaptionTrack[]> {
    try {
      const player = this.getYoutubePlayer()
      const captions = player.getAudioTrack()

      if (
        !captions ||
        !captions.captionTracks ||
        captions.captionTracks.length === 0
      ) {
        throw new SubtitleError(
          'No captions available for this video',
          SubtitleErrorCodes.NO_CAPTIONS
        )
      }

      return captions.captionTracks.map((track) => ({
        languageCode: track.languageCode,
        vssId: track.vssId,
      }))
    } catch (error) {
      throw error
    }
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
          reject(
            new SubtitleError(
              'Failed to intercept subtitle URL after 20 attempts',
              SubtitleErrorCodes.XHR_INTERCEPT_TIMEOUT
            )
          )
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

    if (!subtitles) return []

    this.captionUrl = await this.getSubtitleUrl()

    const url = new URL(this.captionUrl)
    url.searchParams.set('lang', languageCode)
    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new SubtitleError(
          `Failed to fetch subtitles: ${response.status} ${response.statusText}`,
          SubtitleErrorCodes.FETCH_FAILED
        )
      }

      const data = (await response.json()) as YoutubeSubtitle
      return parse(data, 'html')
    } catch (error) {
      if (error instanceof SubtitleError) throw error

      throw new SubtitleError(
        `Failed to process subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`,
        SubtitleErrorCodes.PARSE_FAILED
      )
    }
  }

  async fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]> {
    try {
      return await this.retrieveSubtitles(lang)
    } catch (error) {
      if (
        error instanceof SubtitleError &&
        (error.code === SubtitleErrorCodes.LANGUAGE_NOT_FOUND ||
          error.code === SubtitleErrorCodes.NO_CAPTIONS)
      ) {
        return []
      }

      throw error
    }
  }

  getCurrentSubtitle(
    subtitles: Subtitle[],
    currentTime: number
  ): Subtitle | null {
    const activeSubtitles = subtitles.filter(
      (sub) => currentTime >= sub.begin && currentTime <= sub.end
    )

    return activeSubtitles.at(-1) ?? null
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

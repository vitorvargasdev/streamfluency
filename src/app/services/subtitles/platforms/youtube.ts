import { Subtitle } from '@/app/services/subtitles/types'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'
import { LANGUAGES } from '@/app/services/subtitles/types'
import { PLATFORM } from '@/app/assets/constants'
import parseTranscript from '@/app/services/subtitles/parsers/parser-xml'
import { SubtitlePlatformInterface } from '@/app/services/subtitles/platforms/subtitle-platform.interface'

export class YoutubeSubtitlePlatform implements SubtitlePlatformInterface {
  name = PLATFORM.YOUTUBE
  languageCode: LANGUAGES = {
    [GLOBAL_LANGUAGES.EN]: 'en',
  }

  private async fetchCaptionTracks(): Promise<CaptionTrack[]> {
    const youtubeResponse = (await fetch(window.location.href)).text()
    const youtubeContent = JSON.parse(
      (await youtubeResponse)
        .split('ytInitialPlayerResponse = ')[1]
        .split(';var')[0]
    ) as YoutubeContent
    const captionTracks =
      youtubeContent.captions.playerCaptionsTracklistRenderer.captionTracks

    return captionTracks
  }

  private getBestCaption(
    captions: CaptionTrack[],
    lang: GLOBAL_LANGUAGES
  ): CaptionTrack {
    const languageCode = this.languageCode[lang]
    const filteredCaptions = captions.filter(
      (caption) => caption.languageCode == languageCode
    )
    const bestCaption = filteredCaptions.find(
      (caption) => caption.vssId == `.${languageCode}` || caption.vssId == `a.${languageCode}`
    ) as CaptionTrack

    return bestCaption
  }

  private async retrieveSubtitle(caption: CaptionTrack): Promise<Subtitle[]> {
    const response = await fetch(caption.baseUrl)
    return parseTranscript(await response.text())
  }

  async fetchSubtitles(lang: GLOBAL_LANGUAGES): Promise<Subtitle[]> {
    const captions = await this.fetchCaptionTracks()

    if (captions.length == 0) {
      console.error('No caption tracks found')
      return []
    }

    const bestCaption = this.getBestCaption(captions, lang)

    return await this.retrieveSubtitle(bestCaption)
  }

  getCurrentSubtitle(subtitles: Subtitle[], currentTime: number): string {
    const activeSubtitles = subtitles
      .filter((sub) => currentTime >= sub.begin && currentTime <= sub.end)
      .map((sub) => sub.text)

    return activeSubtitles.at(-1) ?? ''
  }
}

type YoutubeContent = {
  captions: Captions
}

type Captions = {
  playerCaptionsTracklistRenderer: {
    captionTracks: CaptionTrack[]
  }
}

type CaptionTrack = {
  baseUrl: string
  languageCode: string
  vssId: string
}

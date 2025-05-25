import { LANGUAGES, PLATFORM, Subtitle } from '../types'
import { PlatformInterface } from './platform.interface'
import parseTranscript from '../parsers/parser-xml'

export class YoutubePlatform implements PlatformInterface {
  name = PLATFORM.YOUTUBE

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
    lang: LANGUAGES
  ): CaptionTrack {
    const filteredCaptions = captions.filter(
      (caption) => caption.languageCode == lang
    )
    const bestCaption = filteredCaptions.find(
      (caption) => caption.vssId == `.${lang}` || caption.vssId == `a.${lang}`
    ) as CaptionTrack

    return bestCaption
  }

  private async retrieveSubtitle(caption: CaptionTrack): Promise<Subtitle[]> {
    const response = await fetch(caption.baseUrl)
    return parseTranscript(await response.text())
  }

  async fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]> {
    const captions = await this.fetchCaptionTracks()

    if (captions.length == 0) {
      console.error('No caption tracks found')
      return []
    }

    const bestCaption = this.getBestCaption(captions, lang)

    return await this.retrieveSubtitle(bestCaption)
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

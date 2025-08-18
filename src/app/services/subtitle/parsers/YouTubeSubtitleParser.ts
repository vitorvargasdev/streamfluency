import { Subtitle } from '@/app/services/subtitle/types'
import { ISubtitleParser, ParseFormat } from './ISubtitleParser'

export type YoutubeSubtitle = {
  events: Event[]
}

type Event = {
  id: number
  tStartMs: number
  dDurationMs: number
  segs?: segs[]
}

type segs = {
  utf8: string
  acAsrConf?: number
  tOffsetMs?: number
}

const IGNORE_TEXT_MARKER = '<<IGNORE_TEXT>>'

export class YouTubeSubtitleParser implements ISubtitleParser<YoutubeSubtitle> {
  parse(data: YoutubeSubtitle, format: ParseFormat): Subtitle[] {
    return data.events
      .map((event: Event) => {
        let text = event.segs?.map((seg: segs) => seg.utf8).join('')

        if (format === 'html' && text === '\n') {
          text = IGNORE_TEXT_MARKER
        }

        if (format === 'html') {
          text = text?.replaceAll('\n', '<br>')
        }

        return {
          begin: event.tStartMs * 0.001,
          end: (event.tStartMs + event.dDurationMs) * 0.001,
          text,
        } as Subtitle
      })
      .filter((subtitle) => subtitle.text !== undefined)
      .filter((subtitle) => subtitle.text !== IGNORE_TEXT_MARKER)
  }
}

const parser = new YouTubeSubtitleParser()
export default parser.parse.bind(parser)

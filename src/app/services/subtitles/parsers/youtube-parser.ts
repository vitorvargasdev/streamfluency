import { Subtitle } from '@/app/services/subtitles/types'

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

type ParseType = 'html' | 'text'

const parse = (data: YoutubeSubtitle, type: ParseType): Subtitle[] => {
  return data.events
    .map((event: Event) => {
      let text = event.segs?.map((seg: segs) => seg.utf8).join('')

      if (type === 'html' && text === '\n') {
        text = "<<IGNORE_TEXT>>"
      }

      if (type === 'html') {
        text = text?.replaceAll('\n', '<br>')
      }

      return {
        begin: event.tStartMs * 0.001,
        end: event.tStartMs + event.dDurationMs * 0.001,
        text,
      } as Subtitle
    })
    .filter((subtitle) => subtitle.text !== undefined)
    .filter((subtitle) => subtitle.text !== '<<IGNORE_TEXT>>')
}

export default parse
